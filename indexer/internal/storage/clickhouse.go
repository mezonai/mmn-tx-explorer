package storage

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
)

type ClickHouseConnector struct {
	db             *sql.DB
	conn           clickhouse.Conn
	cfg            *config.ClickHouseConfig
	mmnGrpcService *rpc.MMNGrpcService
	// Worker for async wallet updates
	walletWorker *ClickHouseWalletWorker
}

type ClickHouseWalletWorker struct {
	connector *ClickHouseConnector
	queue     chan common.Wallet
	batchSize int
	timeout   time.Duration
	batch     []common.Wallet
	mu        sync.Mutex
}

func NewClickHouseWalletWorker(connector *ClickHouseConnector) *ClickHouseWalletWorker {
	w := &ClickHouseWalletWorker{
		connector: connector,
		queue:     make(chan common.Wallet, 10000), // Buffer
		batchSize: 50,
		timeout:   2 * time.Second,
		batch:     make([]common.Wallet, 0, 50),
	}
	go w.Start()
	return w
}

func (w *ClickHouseWalletWorker) Start() {
	ticker := time.NewTicker(w.timeout)
	defer ticker.Stop()

	for {
		select {
		case wallet := <-w.queue:
			w.mu.Lock()
			w.batch = append(w.batch, wallet)
			if len(w.batch) >= w.batchSize {
				batchToProcess := make([]common.Wallet, len(w.batch))
				copy(batchToProcess, w.batch)
				w.batch = w.batch[:0]
				w.mu.Unlock()
				w.processBatch(batchToProcess)
			} else {
				w.mu.Unlock()
			}
		case <-ticker.C:
			w.mu.Lock()
			if len(w.batch) > 0 {
				batchToProcess := make([]common.Wallet, len(w.batch))
				copy(batchToProcess, w.batch)
				w.batch = w.batch[:0]
				w.mu.Unlock()
				w.processBatch(batchToProcess)
			} else {
				w.mu.Unlock()
			}
		}
	}
}

func (w *ClickHouseWalletWorker) processBatch(wallets []common.Wallet) {
	if len(wallets) == 0 {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 1. Enrich data from MMN (Parallel with limit)
	if w.connector.mmnGrpcService != nil {
		var wg sync.WaitGroup
		sem := make(chan struct{}, 5) // Concurrency limit: 5

		for i := range wallets {
			wg.Add(1)
			go func(idx int) {
				defer wg.Done()
				sem <- struct{}{}
				defer func() { <-sem }()

				// Rate limiting delay
				time.Sleep(20 * time.Millisecond)

				addr := wallets[idx].Address
				var resp *pb.GetAccountResponse
				var err error

				// Retry logic
				for retries := 0; retries < 3; retries++ {
					resp, err = w.connector.mmnGrpcService.GetAccount(ctx, addr)
					if err == nil {
						break
					}
					// Backoff: 100ms, 200ms
					if retries < 2 {
						time.Sleep(time.Duration((retries+1)*100) * time.Millisecond)
					}
				}

				if err != nil {
					log.Warn().Err(err).Str("address", addr).Msg("Worker: Failed to get account from MMN")
				} else if resp != nil {
					// Hack: use fields in Wallet struct if possible, or we need a temporary structure.
					// Since common.Wallet has AccountNonce (pointer) and Balance (pointer big.Int), we can use them.
					wallets[idx].AccountNonce = &resp.Nonce
					if val, ok := new(big.Int).SetString(resp.Balance, 10); ok {
						wallets[idx].Balance = val
					}
				}
			}(i)
		}
		wg.Wait()
	}

	// 2. Insert to ClickHouse
	tx, err := w.connector.db.Begin()
	if err != nil {
		log.Error().Err(err).Msg("Worker: Failed to begin transaction")
		return
	}
	defer func() { _ = tx.Rollback() }()

	stmt, err := tx.PrepareContext(ctx, `INSERT INTO wallets (
		address, account_nonce, balance, updated_at, created_at
	) VALUES (?, ?, ?, ?, ?)`)
	if err != nil {
		log.Error().Err(err).Msg("Worker: Failed to prepare statement")
		return
	}
	defer stmt.Close()

	for _, wallet := range wallets {
		nonce := uint64(0)
		if wallet.AccountNonce != nil {
			nonce = *wallet.AccountNonce
		}
		balance := big.NewInt(0)
		if wallet.Balance != nil {
			balance = wallet.Balance
		}

		_, err := stmt.Exec(
			wallet.Address,
			nonce,
			balance,
			wallet.UpdatedAt,
			wallet.CreatedAt,
		)
		if err != nil {
			log.Error().Err(err).Str("address", wallet.Address).Msg("Worker: Failed to exec insert")
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error().Err(err).Msg("Worker: Failed to commit transaction")
	} else {
		log.Info().Int("count", len(wallets)).Msg("Worker: Successfully updated wallets")
	}
}

func NewClickHouseConnector(cfg *config.ClickHouseConfig) (*ClickHouseConnector, error) {
	sslMode := "false"
	if cfg.SSLMode == "enable" {
		sslMode = "true"
	}

	dsn := fmt.Sprintf("clickhouse://%s:%s@%s:%d/%s?secure=%s&skip_verify=true",
		cfg.Username, cfg.Password, cfg.Host, cfg.Port, cfg.Database, sslMode)

	if cfg.ConnectTimeout > 0 {
		dsn += fmt.Sprintf("&dial_timeout=%ds", cfg.ConnectTimeout)
	}

	db, err := sql.Open("clickhouse", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open clickhouse database: %w", err)
	}

	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(time.Duration(cfg.MaxConnLifetime) * time.Second)

	// Open native connection for high-performance batching
	opts, err := clickhouse.ParseDSN(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse clickhouse dsn: %w", err)
	}
	conn, err := clickhouse.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to open native clickhouse connection: %w", err)
	}

	if err := conn.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping native clickhouse: %w", err)
	}

	connector := &ClickHouseConnector{
		db:   db,
		conn: conn,
		cfg:  cfg,
	}

	// Initialize MMN gRPC service if URL is provided (same as PostgresConnector)
	if config.Cfg.RPC.MMNGRPCURL != "" {
		mmn, err := rpc.NewMMNGrpcService(config.Cfg.RPC.MMNGRPCURL, config.Cfg.RPC.MMNGRPCUseTLS)
		if err != nil {
			log.Warn().Err(err).Msg("Failed to init MMNGrpcService in ClickHouseConnector; wallet sync disabled")
		} else {
			connector.mmnGrpcService = mmn
		}
	}

	// Initialize Worker
	connector.walletWorker = NewClickHouseWalletWorker(connector)

	return connector, nil
}

func (c *ClickHouseConnector) InsertBlockData(data []common.BlockData) error {
	if len(data) == 0 {
		return nil
	}

	start := time.Now()
	ctx := context.Background()

	// Extract UserContents and P2P Offer info
	var userContents []common.UserContent
	txMap := make(map[string]common.Transaction)
	offerIDMap := make(map[string]int64)

	type P2PExtraInfo struct {
		OfferID int64 `json:"offer_id"`
	}

	// 0. Filter blocks and Calculate Max Block
	var filteredData []common.BlockData
	var maxBlock *big.Int
	var chainID *big.Int

	for _, blockData := range data {
		// Calculate Max Block
		if maxBlock == nil || blockData.Block.Number.Cmp(maxBlock) > 0 {
			maxBlock = blockData.Block.Number
			chainID = blockData.Block.ChainID
		}

		// Filter: Only insert blocks with TransactionCount > 0
		if blockData.Block.TransactionCount > 0 {
			filteredData = append(filteredData, blockData)
		}
	}

	// Parallelize insertion into multiple tables for maximum throughput
	g, ctx := errgroup.WithContext(ctx)

	// 1. Insert Transactions (using filtered data)
	if len(filteredData) > 0 {
		for i := range filteredData {
			blockData := &filteredData[i]
			for j := range blockData.Transactions {
				tx := &blockData.Transactions[j]

				// 1. Check for UserContent
				if tx.TransactionType == common.TxTypeUserContent && tx.Status != nil && *tx.Status != uint64(pb.TransactionStatus_FAILED) {
					var userContent common.UserContent
					if err := json.Unmarshal([]byte(tx.ExtraInfo), &userContent); err == nil {
						userContent.TxHash = tx.Hash
						userContent.CreatorAddress = tx.FromAddress
						userContent.RelatedAddress = tx.ToAddress
						userContent.CreatedAt = tx.TransactionTimestamp
						userContents = append(userContents, userContent)
					}
				}

				// 2. Check for P2P Trading (confirm/finalize)
				tx.TransactionExtraInfoType = detectTransactionType(tx.ExtraInfo)
				if tx.TransactionExtraInfoType == common.TransactionExtraInfoP2PTrading && tx.ExtraInfo != "" && tx.Status != nil &&
					(*tx.Status == uint64(pb.TransactionStatus_CONFIRMED) || *tx.Status == uint64(pb.TransactionStatus_FINALIZED)) {
					txMap[tx.Hash] = *tx
					var extra P2PExtraInfo
					if err := json.Unmarshal([]byte(tx.ExtraInfo), &extra); err == nil && extra.OfferID != 0 {
						offerIDMap[tx.Hash] = extra.OfferID
					}
				}
			}
		}

		g.Go(func() error {
			if err := c.insertTransactionsBatch(ctx, filteredData); err != nil {
				return fmt.Errorf("failed to insert transactions batch: %w", err)
			}
			return nil
		})

		// 2. Insert Blocks (using filtered data)
		g.Go(func() error {
			if err := c.insertBlocksBatch(ctx, filteredData); err != nil {
				return fmt.Errorf("failed to insert blocks batch: %w", err)
			}
			return nil
		})

		// 3. Insert UserContents (Remote call to dong-service)
		if len(userContents) > 0 {
			g.Go(func() error {
				if err := c.insertUserContentsRemote(ctx, userContents); err != nil {
					log.Error().Err(err).Msg("Failed to insert user contents to dong-service")
					return err
				}
				return nil
			})
		}

		// 4. Update P2P Offer Statuses (Remote call to dong-service)
		if len(txMap) > 0 {
			g.Go(func() error {
				if err := c.updateOfferStatusRemote(ctx, txMap, offerIDMap); err != nil {
					log.Error().Err(err).Msg("Failed to update offer status at dong-service")
					return err
				}
				return nil
			})
		}

		if err := g.Wait(); err != nil {
			return err
		}

		// 5. Queue Wallets for Async Update
		c.queueWalletUpdates(filteredData)
	}

	// 6. Update Metadata (Synchronous)
	// We do this synchronously to ensure the next indexer loop sees the updated max block
	if maxBlock != nil && chainID != nil {
		// Use a fresh context (or the parent context) because 'ctx' from errgroup is canceled after g.Wait()
		if err := c.updateMaxSyncedBlock(context.Background(), chainID, maxBlock); err != nil {
			log.Error().Err(err).Msg("Failed to update max synced block")
			return err
		}
	}

	log.Info().Int("total_blocks", len(data)).Int("inserted_blocks", len(filteredData)).Int("user_contents", len(userContents)).Int("offers_updated", len(txMap)).Dur("duration", time.Since(start)).Msg("Successfully processed batch (Parallel)")
	return nil
}

func (c *ClickHouseConnector) insertBlocksBatch(ctx context.Context, data []common.BlockData) error {
	batch, err := c.conn.PrepareBatch(ctx, `INSERT INTO blocks (
		chain_id, block_number, hash, parent_hash, block_timestamp, transaction_count
	)`)
	if err != nil {
		return err
	}

	for _, blockData := range data {
		err = batch.Append(
			blockData.Block.ChainID,
			blockData.Block.Number,
			blockData.Block.Hash,
			blockData.Block.ParentHash,
			blockData.Block.Timestamp,
			blockData.Block.TransactionCount,
		)
		if err != nil {
			return err
		}
	}

	return batch.Send()
}

func (c *ClickHouseConnector) insertTransactionsBatch(ctx context.Context, data []common.BlockData) error {
	batch, err := c.conn.PrepareBatch(ctx, `INSERT INTO transactions (
		chain_id, hash, nonce, block_hash, block_number, from_address, to_address, value, 
		transaction_type, status, transaction_timestamp, text_data, extra_info, transaction_extra_info_type
	)`)
	if err != nil {
		return err
	}

	for _, blockData := range data {
		for _, txData := range blockData.Transactions {
			val, _ := new(big.Int).SetString(txData.Value, 10)
			if val == nil {
				val = big.NewInt(0)
			}
			var status uint64
			if txData.Status != nil {
				status = *txData.Status
			}
			txData.TransactionExtraInfoType = detectTransactionType(txData.ExtraInfo)

			err = batch.Append(
				txData.ChainID,
				txData.Hash,
				txData.Nonce,
				txData.BlockHash,
				txData.BlockNumber,
				txData.FromAddress,
				txData.ToAddress,
				val,
				txData.TransactionType,
				status,
				txData.TransactionTimestamp,
				txData.TextData,
				txData.ExtraInfo,
				string(txData.TransactionExtraInfoType),
			)
			if err != nil {
				return err
			}
		}
	}

	return batch.Send()
}

func (c *ClickHouseConnector) queueWalletUpdates(data []common.BlockData) {
	if c.walletWorker == nil {
		return
	}

	// Extract unique wallets from transactions
	wallets := make(map[string]common.Wallet)
	for _, blockData := range data {
		for _, tx := range blockData.Transactions {
			// From Address
			if tx.FromAddress != "" {
				if _, exists := wallets[tx.FromAddress]; !exists {
					wallets[tx.FromAddress] = common.Wallet{
						Address:   tx.FromAddress,
						UpdatedAt: tx.TransactionTimestamp,
						CreatedAt: tx.TransactionTimestamp,
					}
				}
			}
			// To Address
			if tx.ToAddress != "" {
				if _, exists := wallets[tx.ToAddress]; !exists {
					wallets[tx.ToAddress] = common.Wallet{
						Address:   tx.ToAddress,
						UpdatedAt: tx.TransactionTimestamp,
						CreatedAt: tx.TransactionTimestamp,
					}
				}
			}
		}
	}

	// Non-blocking push to worker queue
	for _, w := range wallets {
		select {
		case c.walletWorker.queue <- w:
		default:
			log.Warn().Str("address", w.Address).Msg("Wallet worker queue full, dropping update")
		}
	}
}

func (c *ClickHouseConnector) ReplaceBlockData(data []common.BlockData) ([]common.BlockData, error) {
	// ClickHouse is append-only mostly. Replacing data usually means inserting with a higher version
	// or using ReplacingMergeTree.
	return nil, nil
}

func (c *ClickHouseConnector) GetBlocks(qf *QueryFilter, fields ...string) (QueryResult[common.Block], error) {
	// Query columns match 'p_by_timestamp' projection (chain_id, block_number, hash, parent_hash, block_timestamp, transaction_count)
	// This allows ClickHouse to use the projection for sorting by block_timestamp if applicable.

	// Default fields if none provided (must match what we want to select)
	// ClickHouse driver uses ? for placeholders.

	defaults := []string{"chain_id", "block_number", "hash", "parent_hash", "block_timestamp", "transaction_count"}
	columns := BuildSelectFields(fields, defaults)

	query, args := BuildQueryWithNamedArgs("blocks", columns, qf)
	// Convert to positional args for ClickHouse (?)
	finalQuery, finalArgs := ConvertQueryNamedArgsToPositional(query, args, "question")

	rows, err := c.db.Query(finalQuery, finalArgs...)
	if err != nil {
		return QueryResult[common.Block]{}, fmt.Errorf("failed to query blocks: %w", err)
	}
	defer rows.Close()

	var blocks []common.Block
	for rows.Next() {
		var b common.Block
		var chainIDVal, blockNumberVal uint64
		// We use Scan matching expected columns even if fields param varies, assuming strict usage for now.
		if err := rows.Scan(&chainIDVal, &blockNumberVal, &b.Hash, &b.ParentHash, &b.Timestamp, &b.TransactionCount); err != nil {
			return QueryResult[common.Block]{}, fmt.Errorf("failed to scan block: %w", err)
		}
		b.ChainID = new(big.Int).SetUint64(chainIDVal)
		b.Number = new(big.Int).SetUint64(blockNumberVal)
		blocks = append(blocks, b)
	}

	return QueryResult[common.Block]{
		Data: blocks,
	}, nil
}

func (c *ClickHouseConnector) GetTransactions(ctx context.Context, qf *QueryFilter, fields ...string) (QueryResult[common.Transaction], error) {
	return QueryResult[common.Transaction]{}, nil
}

func (c *ClickHouseConnector) GetAggregations(ctx context.Context, table string, qf *QueryFilter) (QueryResult[interface{}], error) {
	return QueryResult[interface{}]{}, nil
}

func (c *ClickHouseConnector) GetMaxBlockNumber(chainID *big.Int) (*big.Int, error) {
	var val interface{}
	// Use max(max_synced_block) to handle ReplacingMergeTree potential duplicates before merge
	err := c.db.QueryRow("SELECT max(max_synced_block) FROM indexing_metadata WHERE chain_id = ?", chainID.String()).Scan(&val)
	if err != nil {
		if err == sql.ErrNoRows {
			return big.NewInt(0), nil
		}
		return nil, fmt.Errorf("failed to get max block number: %w", err)
	}
	if val == nil {
		// Fallback to blocks table if metadata is empty (migration scenario)
		log.Warn().Msg("indexing_metadata empty, falling back to blocks table for MaxBlock")
		return c.getMaxBlockNumberFromBlocks(chainID)
	}

	switch v := val.(type) {
	case *big.Int:
		return v, nil
	case big.Int:
		return &v, nil
	case string:
		res, ok := new(big.Int).SetString(v, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse max block number string: %s", v)
		}
		return res, nil
	case uint64:
		return new(big.Int).SetUint64(v), nil
	default:
		// Attempt reflection or fmt to handle ClickHouse/driver type vagaries
		s := fmt.Sprintf("%v", v)
		res, ok := new(big.Int).SetString(s, 10)
		if !ok {
			return nil, fmt.Errorf("unexpected type for max block number: %T, value: %v", val, val)
		}
		return res, nil
	}
}

func (c *ClickHouseConnector) getMaxBlockNumberFromBlocks(chainID *big.Int) (*big.Int, error) {
	var val interface{}
	err := c.db.QueryRow("SELECT block_number FROM blocks WHERE chain_id = ? ORDER BY block_number DESC LIMIT 1", chainID.String()).Scan(&val)
	if err != nil {
		if err == sql.ErrNoRows {
			return big.NewInt(0), nil
		}
		return nil, fmt.Errorf("failed to get max block number from blocks: %w", err)
	}
	if val == nil {
		return big.NewInt(0), nil
	}
	// Simplified parsing for fallback
	s := fmt.Sprintf("%v", val)
	res, ok := new(big.Int).SetString(s, 10)
	if !ok {
		return big.NewInt(0), nil
	}
	return res, nil
}

func (c *ClickHouseConnector) GetMaxBlockNumberInRange(chainID *big.Int, startBlock *big.Int, endBlock *big.Int) (*big.Int, error) {
	var val interface{}
	err := c.db.QueryRow("SELECT block_number FROM blocks WHERE chain_id = ? AND block_number >= ? AND block_number <= ? ORDER BY block_number DESC LIMIT 1",
		chainID.String(), startBlock.String(), endBlock.String()).Scan(&val)
	if err != nil {
		if err == sql.ErrNoRows {
			return big.NewInt(0), nil
		}
		return nil, fmt.Errorf("failed to get max block number in range: %w", err)
	}
	if val == nil {
		return big.NewInt(0), nil
	}

	switch v := val.(type) {
	case *big.Int:
		return v, nil
	case big.Int:
		return &v, nil
	case string:
		res, ok := new(big.Int).SetString(v, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse max block number in range string: %s", v)
		}
		return res, nil
	default:
		return nil, fmt.Errorf("unexpected type for max block number in range: %T", val)
	}
}

func (c *ClickHouseConnector) GetBlockHeadersDescending(chainID *big.Int, from *big.Int, to *big.Int) ([]common.BlockHeader, error) {
	return nil, nil
}

func (c *ClickHouseConnector) GetValidationBlockData(chainID *big.Int, startBlock *big.Int, endBlock *big.Int) ([]common.BlockData, error) {
	return nil, nil
}

func (c *ClickHouseConnector) FindMissingBlockNumbers(chainID *big.Int, startBlock *big.Int, endBlock *big.Int) ([]*big.Int, error) {
	return nil, nil
}

func (c *ClickHouseConnector) GetFullBlockData(chainID *big.Int, blockNumbers []*big.Int) ([]common.BlockData, error) {
	return nil, nil
}

func (c *ClickHouseConnector) GetCount(ctx context.Context, table string, qf *QueryFilter) (uint64, error) {
	var count uint64
	query := fmt.Sprintf("SELECT count() FROM %s", table)

	// Add basic WHERE clause if needed (simplified)
	whereClauses := []string{}
	if qf != nil {
		if qf.ChainID != nil && qf.ChainID.Sign() > 0 {
			whereClauses = append(whereClauses, fmt.Sprintf("chain_id = %s", qf.ChainID.String()))
		}
	}
	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	err := c.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count rows in %s: %w", table, err)
	}
	return count, nil
}

func (c *ClickHouseConnector) GetDashboardStats(ctx context.Context, qf *QueryFilter) (totalBlocks uint64, totalTransactions uint64, totalWallets uint64, averageBlockTime float64, totalGiveCoffee uint64, totalP2POfferAvailable float64, totalOffers uint64, err error) {
	// Optimized query using network_summary AggregatingMergeTree
	query := `
		SELECT 
			metric_name,
			CASE 
				WHEN metric_name = 'total_wallets' THEN uniqMerge(uniq_value)
				ELSE sumMerge(sum_value)
			END AS value
		FROM network_summary
		GROUP BY metric_name
	`

	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return 0, 0, 0, 0, 0, 0, 0, fmt.Errorf("failed to query network_summary: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var metricName string
		var value uint64
		if err := rows.Scan(&metricName, &value); err != nil {
			return 0, 0, 0, 0, 0, 0, 0, fmt.Errorf("failed to scan network_summary row: %w", err)
		}

		switch metricName {
		case "total_blocks":
			totalBlocks = value
		case "total_transactions":
			totalTransactions = value
		case "total_wallets":
			totalWallets = value
		}
	}

	if err := rows.Err(); err != nil {
		return 0, 0, 0, 0, 0, 0, 0, fmt.Errorf("error iterating network_summary rows: %w", err)
	}

	// Default values for other fields
	return totalBlocks, totalTransactions, totalWallets, averageBlockTime, totalGiveCoffee, totalP2POfferAvailable, totalOffers, nil
}

func (c *ClickHouseConnector) GetPendingTransactions(ctx context.Context) (*pb.GetPendingTransactionsResponse, error) {
	return nil, nil
}

func (c *ClickHouseConnector) GetTransactionsByWalletPaginated(ctx context.Context, walletAddress string, limit, offset int, sortOrder string, startTime, endTime int64) ([]common.Transaction, error) {
	return nil, nil
}

func (c *ClickHouseConnector) GetTransactionsByWalletCount(ctx context.Context, walletAddress string, startTime, endTime int64) (uint64, error) {
	return 0, nil
}

func (c *ClickHouseConnector) GetTotalTransactions(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (c *ClickHouseConnector) GetTransactionsByWalletWithTimestamp(ctx context.Context, walletAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	return nil, nil
}

func (c *ClickHouseConnector) GetTransactionsByFromAddressWithTimestamp(ctx context.Context, fromAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	return nil, nil
}

func (c *ClickHouseConnector) GetTransactionsByToAddressWithTimestamp(ctx context.Context, toAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	return nil, nil
}

func (c *ClickHouseConnector) RecalculateStats(ctx context.Context) error {
	return nil
}

func (c *ClickHouseConnector) GetAllTransactionsByWallet(ctx context.Context, walletAddress string, startTime, endTime int64, sortBy, sortOrder string) ([]common.Transaction, error) {
	return nil, nil
}

func (c *ClickHouseConnector) insertUserContentsRemote(ctx context.Context, items []common.UserContent) error {
	url := fmt.Sprintf("%s/internal/v1/user-contents", config.Cfg.InternalServices.DongServiceURL)

	jsonData, err := json.Marshal(items)
	if err != nil {
		return fmt.Errorf("failed to marshal user contents: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-API-Key", config.Cfg.InternalServices.DongServiceAPIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call dong-service:insertUserContentsRemote %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("dong-service:insertUserContentsRemote returned non-OK status: %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (c *ClickHouseConnector) updateOfferStatusRemote(
	ctx context.Context,
	txMap map[string]common.Transaction,
	offerIDMap map[string]int64,
) error {
	url := fmt.Sprintf("%s/internal/v1/update-offer-status", config.Cfg.InternalServices.DongServiceURL)

	type InternalTransactionInfo struct {
		Hash        string `json:"hash"`
		FromAddress string `json:"from_address"`
		ToAddress   string `json:"to_address"`
		Value       string `json:"value"`
	}

	type BatchUpdateOfferStatusRequest struct {
		Transactions map[string]InternalTransactionInfo `json:"transactions"`
		OfferIDMap   map[string]int64                   `json:"offer_id_map"`
	}

	payload := BatchUpdateOfferStatusRequest{
		Transactions: make(map[string]InternalTransactionInfo),
		OfferIDMap:   offerIDMap,
	}

	for hash, t := range txMap {
		payload.Transactions[hash] = InternalTransactionInfo{
			Hash:        t.Hash,
			FromAddress: t.FromAddress,
			ToAddress:   t.ToAddress,
			Value:       t.Value,
		}
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal batch update request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-API-Key", config.Cfg.InternalServices.DongServiceAPIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call dong-service:updateOfferStatusRemote %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("dong-service:updateOfferStatusRemote returned non-OK status: %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (c *ClickHouseConnector) updateMaxSyncedBlock(ctx context.Context, chainID *big.Int, maxBlock *big.Int) error {
	err := c.conn.Exec(ctx, `INSERT INTO indexing_metadata (
		chain_id, max_synced_block
	) VALUES (?, ?)`,
		chainID,
		maxBlock,
	)
	if err != nil {
		return fmt.Errorf("failed to update max synced block number %d: %w", maxBlock, err)
	}
	return nil
}
