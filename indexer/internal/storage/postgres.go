package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/lib/pq"
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
)

const (
	DataRowsDisplayLimit   = 500000
	InsertBlockDataTimeout = 10 * time.Minute
)

type PostgresConnector struct {
	db             *sql.DB
	cfg            *config.PostgresConfig
	mmnGrpcService *rpc.MMNGrpcService
	// Wallet update optimization
	walletUpdateBatcher *WalletUpdateBatcher
}

// WalletUpdateBatcher manages batched wallet updates and realtime MMN service calls
type WalletUpdateBatcher struct {
	mmnQueue        chan WalletStats
	mmnBatchSize    int
	mmnBatchTimeout time.Duration
	mmnConcurrency  int
	connector       *PostgresConnector
	stopChan        chan struct{}
}

type WalletStats struct {
	Address          string
	TransactionCount int64
	MaxBlock         *big.Int
}

// NewWalletUpdateBatcher creates a new wallet update batcher
func NewWalletUpdateBatcher(connector *PostgresConnector) *WalletUpdateBatcher {
	batcher := &WalletUpdateBatcher{
		mmnQueue:        make(chan WalletStats, 100000), // Buffer for 100000 addresses
		mmnBatchSize:    50,                             // Process 50 addresses per batch
		mmnBatchTimeout: 2 * time.Second,                // Max wait time for batch
		mmnConcurrency:  4,                              // Max concurrent MMN calls
		connector:       connector,
		stopChan:        make(chan struct{}),
	}

	// Start the MMN batch processor
	go batcher.processMMNQueue()

	return batcher
}

// QueueMMNServiceCall queues an address for batch MMN service processing
func (wub *WalletUpdateBatcher) QueueMMNServiceCall(walletStats WalletStats) {
	if walletStats.Address == "" || wub.connector.mmnGrpcService == nil {
		return
	}

	// Non-blocking send to queue
	select {
	case wub.mmnQueue <- walletStats:
		// Successfully queued
	default:
		// Queue is full, skip this address
		log.Debug().Str("address", walletStats.Address).Msg("MMN queue is full, skipping address")
	}
}

// processMMNQueue processes MMN service calls in batches
func (wub *WalletUpdateBatcher) processMMNQueue() {
	batch := make([]WalletStats, 0, wub.mmnBatchSize)
	timer := time.NewTimer(wub.mmnBatchTimeout)
	timer.Stop()

	for {
		select {
		case walletStats := <-wub.mmnQueue:
			// Add address to current batch
			batch = append(batch, walletStats)

			// Start timer if this is the first address in batch
			if len(batch) == 1 {
				timer.Reset(wub.mmnBatchTimeout)
			}

			// Process batch if it reaches the batch size
			if len(batch) >= wub.mmnBatchSize {
				wub.processMMNBatch(batch)
				batch = batch[:0] // Reset batch
				timer.Stop()
			}

		case <-timer.C:
			// Timeout reached, process current batch
			if len(batch) > 0 {
				wub.processMMNBatch(batch)
				batch = batch[:0] // Reset batch
			}

		case <-wub.stopChan:
			// Process remaining addresses before stopping
			if len(batch) > 0 {
				wub.processMMNBatch(batch)
			}
			timer.Stop()
			return
		}
	}
}

// processMMNBatch processes a batch of addresses for MMN service calls
func (wub *WalletUpdateBatcher) processMMNBatch(walletStatsBatch []WalletStats) {
	if len(walletStatsBatch) == 0 {
		return
	}

	log.Debug().Int("count", len(walletStatsBatch)).Msg("Processing MMN service batch")

	// Process addresses in parallel with limited concurrency
	semaphore := make(chan struct{}, wub.mmnConcurrency)
	var wg sync.WaitGroup

	for _, walletStats := range walletStatsBatch {
		wg.Add(1)
		go func(walletStats WalletStats) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Call MMN service
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			if err := wub.connector.refreshWalletFromService(ctx, walletStats); err != nil {
				log.Debug().Err(err).Str("address", walletStats.Address).Msg("Failed to refresh wallet from MMN service")
			}
		}(walletStats)
	}

	wg.Wait()
	log.Debug().Int("count", len(walletStatsBatch)).Msg("Completed MMN service batch")
}

// Stop gracefully stops the MMN batch processor
func (wub *WalletUpdateBatcher) Stop() {
	close(wub.stopChan)
}

var defaultBlockFields = []string{
	"chain_id", "block_number", "block_timestamp", "hash", "parent_hash", "transaction_count",
}

var defaultTransactionFields = []string{
	"chain_id", "hash", "nonce", "block_hash", "block_number", "from_address", "to_address",
	"transaction_timestamp", "value", "transaction_type", "status", "text_data", "extra_info", "transaction_extra_info_type",
}

var defaultExportTransactionFields = []string{
	"chain_id", "hash", "nonce", "block_hash", "block_number", "from_address", "to_address",
	"transaction_timestamp", "value", "transaction_type", "status", "text_data", "transaction_extra_info_type",
}

var defaultWalletFields = []string{
	"address", "account_nonce", "balance", "transaction_count", "last_block",
}

var validSortByColumns = map[string][]string{
	"blocks":       defaultBlockFields,
	"transactions": defaultTransactionFields,
	"wallet":       defaultWalletFields,
}

func NewPostgresConnector(cfg *config.PostgresConfig) (*PostgresConnector, error) {
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Database)

	// Default to "require" for security if SSL mode not specified
	sslMode := cfg.SSLMode
	if sslMode == "" {
		sslMode = "require"
		log.Info().Msg("No SSL mode specified, defaulting to 'require' for secure connection")
	}
	connStr += fmt.Sprintf(" sslmode=%s", sslMode)

	if cfg.ConnectTimeout > 0 {
		connStr += fmt.Sprintf(" connect_timeout=%d", cfg.ConnectTimeout)
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}

	// Configure connection pool for optimal performance
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)

	if cfg.MaxConnLifetime > 0 {
		db.SetConnMaxLifetime(time.Duration(cfg.MaxConnLifetime) * time.Second)
	}

	// Set connection max idle time to prevent stale connections
	// This helps maintain healthy connections and avoid lazy initialization delays
	db.SetConnMaxIdleTime(30 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	// Perform comprehensive warmup queries to pre-load database metadata and avoid lazy initialization delays
	// This helps reduce the 100-300ms delay on first query by warming up the connection and metadata cache
	log.Info().Msg("Performing database warmup queries to pre-load metadata...")
	start := time.Now()

	// Basic connectivity test
	var tmp int
	if err := db.QueryRow("SELECT 1").Scan(&tmp); err != nil {
		log.Warn().Err(err).Msg("Database basic warmup query failed, but continuing...")
	}

	// Warmup common table metadata by querying system catalogs
	// This pre-loads table structure information that would otherwise be loaded lazily
	warmupQueries := []string{
		"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'",
		"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public'",
		"SELECT 1 FROM pg_stat_activity LIMIT 1",
	}

	for i, query := range warmupQueries {
		if err := db.QueryRow(query).Scan(&tmp); err != nil {
			log.Debug().Err(err).Int("query_index", i).Msg("Database warmup query failed, but continuing...")
		}
	}

	duration := time.Since(start)
	log.Info().Dur("duration", duration).Msg("Database warmup completed successfully")

	connector := &PostgresConnector{
		db:  db,
		cfg: cfg,
	}

	// Initialize MMN gRPC service if URL is provided
	if config.Cfg.RPC.MMNGRPCURL != "" {
		mmn, err := rpc.NewMMNGrpcService(config.Cfg.RPC.MMNGRPCURL, config.Cfg.RPC.MMNGRPCUseTLS)
		if err != nil {
			log.Warn().Err(err).Msg("Failed to init MMNGrpcService; wallet sync disabled")
		} else {
			connector.mmnGrpcService = mmn
		}
	}

	// Initialize wallet update batcher
	connector.walletUpdateBatcher = NewWalletUpdateBatcher(connector)

	return connector, nil
}

// DB exposes the underlying *sql.DB for internal utilities like migrations.
func (p *PostgresConnector) DB() *sql.DB {
	return p.db
}

func (p *PostgresConnector) GetBlockFailures(qf *QueryFilter) ([]common.BlockFailure, error) {
	query := `SELECT chain_id, block_number, last_error_timestamp, failure_count, reason FROM block_failures`

	args := []interface{}{}
	argCount := 0

	if qf.ChainID != nil && qf.ChainID.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(qf.ChainID))
	}

	if len(qf.BlockNumbers) > 0 {
		blockNumberStrs := make([]string, len(qf.BlockNumbers))
		for i, bn := range qf.BlockNumbers {
			blockNumberStrs[i] = bigIntToString(bn)
		}
		query += fmt.Sprintf(" AND block_number IN (%s)", strings.Join(blockNumberStrs, ","))
	}

	if qf.SortBy != "" {
		query += fmt.Sprintf(" ORDER BY %s", qf.SortBy)
		if qf.SortOrder != "" {
			query += " " + qf.SortOrder
		}
	} else {
		query += " ORDER BY block_number DESC"
	}

	if qf.Limit > 0 {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, qf.Limit)
	}

	if qf.Offset > 0 {
		argCount++
		query += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, qf.Offset)
	}

	rows, err := p.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetBlockFailures")
		}
	}()

	var failures []common.BlockFailure
	for rows.Next() {
		var failure common.BlockFailure
		var chainIDStr, blockNumberStr string
		var timestamp int64
		var count int

		// NUMERIC columns are scanned as strings by pq driver
		err := rows.Scan(&chainIDStr, &blockNumberStr, &timestamp, &count, &failure.FailureReason)
		if err != nil {
			return nil, fmt.Errorf("error scanning block failure: %w", err)
		}

		// Convert NUMERIC string to big.Int
		var ok bool
		failure.ChainID, ok = new(big.Int).SetString(chainIDStr, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse chain_id '%s' as big.Int", chainIDStr)
		}

		failure.BlockNumber, ok = new(big.Int).SetString(blockNumberStr, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse block_number '%s' as big.Int", blockNumberStr)
		}

		failure.FailureTime = time.Unix(timestamp, 0)
		failure.FailureCount = count

		failures = append(failures, failure)
	}

	return failures, rows.Err()
}

func (p *PostgresConnector) StoreBlockFailures(failures []common.BlockFailure) error {
	if len(failures) == 0 {
		return nil
	}

	// Build multi-row INSERT without transaction for better performance
	valueStrings := make([]string, 0, len(failures))
	valueArgs := make([]interface{}, 0, len(failures)*5)

	for i, failure := range failures {
		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d)",
			i*5+1, i*5+2, i*5+3, i*5+4, i*5+5))
		valueArgs = append(valueArgs,
			bigIntToString(failure.ChainID),
			bigIntToString(failure.BlockNumber),
			failure.FailureTime.Unix(),
			failure.FailureCount,
			failure.FailureReason,
		)
	}

	query := fmt.Sprintf(`INSERT INTO block_failures (chain_id, block_number, last_error_timestamp, failure_count, reason)
			VALUES %s
			ON CONFLICT (chain_id, block_number) 
			DO UPDATE SET 
				last_error_timestamp = EXCLUDED.last_error_timestamp,
				failure_count = EXCLUDED.failure_count,
				reason = EXCLUDED.reason,
				updated_at = NOW()`, strings.Join(valueStrings, ","))

	_, err := p.db.Exec(query, valueArgs...)
	return err
}

func (p *PostgresConnector) DeleteBlockFailures(failures []common.BlockFailure) error {
	if len(failures) == 0 {
		return nil
	}

	// Build single DELETE query with all tuples
	tuples := make([]string, 0, len(failures))
	args := make([]interface{}, 0, len(failures)*2)

	for i, failure := range failures {
		tuples = append(tuples, fmt.Sprintf("($%d, $%d)", i*2+1, i*2+2))
		args = append(args, bigIntToString(failure.ChainID), bigIntToString(failure.BlockNumber))
	}

	query := fmt.Sprintf(`DELETE FROM block_failures
	WHERE ctid IN (
		SELECT ctid
		FROM block_failures
		WHERE (chain_id, block_number) IN (%s)
		FOR UPDATE SKIP LOCKED
	)`, strings.Join(tuples, ","))

	_, err := p.db.Exec(query, args...)
	return err
}

func (p *PostgresConnector) GetLastReorgCheckedBlockNumber(chainID *big.Int) (*big.Int, error) {
	query := `SELECT cursor_value FROM cursors WHERE cursor_type = 'reorg' AND chain_id = $1`

	var blockNumberString string
	err := p.db.QueryRow(query, bigIntToString(chainID)).Scan(&blockNumberString)
	if err != nil {
		return nil, err
	}

	blockNumber, ok := new(big.Int).SetString(blockNumberString, 10)
	if !ok {
		return nil, fmt.Errorf("failed to parse block number: %s", blockNumberString)
	}

	return blockNumber, nil
}

func (p *PostgresConnector) SetLastReorgCheckedBlockNumber(chainID, blockNumber *big.Int) error {
	query := `INSERT INTO cursors (chain_id, cursor_type, cursor_value)
			VALUES ($1, 'reorg', $2)
			ON CONFLICT (chain_id, cursor_type) 
			DO UPDATE SET cursor_value = EXCLUDED.cursor_value, updated_at = NOW()`

	_, err := p.db.Exec(query, bigIntToString(chainID), bigIntToString(blockNumber))
	return err
}

// Staging Storage Implementation

func (p *PostgresConnector) InsertStagingData(data []common.BlockData) error {
	if len(data) == 0 {
		return nil
	}

	// Build multi-row INSERT without transaction for better performance
	valueStrings := make([]string, 0, len(data))
	valueArgs := make([]interface{}, 0, len(data)*3)

	for i := range data {
		blockData := &data[i]
		blockDataJSON, err := json.Marshal(blockData)
		err = nil
		if err != nil {
			return err
		}

		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d)",
			i*3+1, i*3+2, i*3+3))
		valueArgs = append(valueArgs,
			bigIntToString(blockData.Block.ChainID),
			bigIntToString(blockData.Block.Number),
			string(blockDataJSON),
		)
	}

	query := fmt.Sprintf(`INSERT INTO block_data (chain_id, block_number, data)
			VALUES %s
			ON CONFLICT (chain_id, block_number) 
			DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`, strings.Join(valueStrings, ","))

	_, err := p.db.Exec(query, valueArgs...)
	return err
}

func (p *PostgresConnector) GetStagingData(qf *QueryFilter) ([]common.BlockData, error) {
	// No need to check is_deleted since we're using hard deletes for staging data
	query := `SELECT data FROM block_data WHERE 1=1`

	args := []interface{}{}
	argCount := 0

	if qf.ChainID != nil && qf.ChainID.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(qf.ChainID))
	}

	if len(qf.BlockNumbers) > 0 {
		placeholders := make([]string, len(qf.BlockNumbers))
		for i, bn := range qf.BlockNumbers {
			argCount++
			placeholders[i] = fmt.Sprintf("$%d", argCount)
			args = append(args, bigIntToString(bn))
		}
		query += fmt.Sprintf(" AND block_number IN (%s)", strings.Join(placeholders, ","))
	} else if qf.StartBlock != nil && qf.EndBlock != nil {
		argCount++
		query += fmt.Sprintf(" AND block_number BETWEEN $%d AND $%d", argCount, argCount+1)
		args = append(args, bigIntToString(qf.StartBlock), bigIntToString(qf.EndBlock))
		argCount++ // Increment once more since we used two args
	}

	query += " ORDER BY block_number ASC"

	if qf.Limit > 0 {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, qf.Limit)
	}

	rows, err := p.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetStagingData")
		}
	}()

	// Initialize as empty slice to match ClickHouse behavior
	blockDataList := make([]common.BlockData, 0)
	for rows.Next() {
		var blockDataJSON string
		if err := rows.Scan(&blockDataJSON); err != nil {
			return nil, fmt.Errorf("error scanning block data: %w", err)
		}

		var blockData common.BlockData
		if err := json.Unmarshal([]byte(blockDataJSON), &blockData); err != nil {
			return nil, err
		}

		blockDataList = append(blockDataList, blockData)
	}

	return blockDataList, rows.Err()
}

func (p *PostgresConnector) DeleteStagingData(data []common.BlockData) error {
	if len(data) == 0 {
		return nil
	}

	// Build single DELETE query with all tuples
	tuples := make([]string, 0, len(data))
	args := make([]interface{}, 0, len(data)*2)

	for i := range data {
		blockData := &data[i]
		tuples = append(tuples, fmt.Sprintf("($%d, $%d)", i*2+1, i*2+2))
		args = append(args, bigIntToString(blockData.Block.ChainID), bigIntToString(blockData.Block.Number))
	}

	query := fmt.Sprintf(`DELETE FROM block_data
	WHERE ctid IN (
		SELECT ctid
		FROM block_failures
		WHERE (chain_id, block_number) IN (%s)
		FOR UPDATE SKIP LOCKED
	)`, strings.Join(tuples, ","))

	_, err := p.db.Exec(query, args...)
	return err
}

func (p *PostgresConnector) GetLastPublishedBlockNumber(chainID *big.Int) (*big.Int, error) {
	query := `SELECT cursor_value FROM cursors WHERE cursor_type = 'publish' AND chain_id = $1`

	var blockNumberString string
	err := p.db.QueryRow(query, bigIntToString(chainID)).Scan(&blockNumberString)
	if err != nil {
		if err == sql.ErrNoRows {
			return big.NewInt(0), nil
		}
		return nil, err
	}

	blockNumber, ok := new(big.Int).SetString(blockNumberString, 10)
	if !ok {
		return nil, fmt.Errorf("failed to parse block number: %s", blockNumberString)
	}
	return blockNumber, nil
}

func (p *PostgresConnector) SetLastPublishedBlockNumber(chainID, blockNumber *big.Int) error {
	query := `INSERT INTO cursors (chain_id, cursor_type, cursor_value)
				VALUES ($1, 'publish', $2)
				ON CONFLICT (chain_id, cursor_type)
				DO UPDATE SET cursor_value = EXCLUDED.cursor_value, updated_at = NOW()`

	_, err := p.db.Exec(query, bigIntToString(chainID), bigIntToString(blockNumber))
	return err
}

func (p *PostgresConnector) GetLastStagedBlockNumber(chainID, rangeStart, rangeEnd *big.Int) (*big.Int, error) {
	query := `SELECT MAX(block_number) FROM block_data WHERE 1=1`

	args := []interface{}{}
	argCount := 0

	if chainID != nil && chainID.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(chainID))
	}

	if rangeStart != nil && rangeStart.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND block_number >= $%d", argCount)
		args = append(args, bigIntToString(rangeStart))
	}

	if rangeEnd != nil && rangeEnd.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND block_number <= $%d", argCount)
		args = append(args, bigIntToString(rangeEnd))
	}

	var blockNumberStr sql.NullString
	err := p.db.QueryRow(query, args...).Scan(&blockNumberStr)
	if err != nil {
		return nil, err
	}

	// MAX returns NULL when no rows match
	if !blockNumberStr.Valid {
		return big.NewInt(0), nil
	}

	blockNumber, ok := new(big.Int).SetString(blockNumberStr.String, 10)
	if !ok {
		return nil, fmt.Errorf("failed to parse block number: %s", blockNumberStr.String)
	}

	return blockNumber, nil
}

func (p *PostgresConnector) DeleteOlderThan(chainID, blockNumber *big.Int) error {
	query := `DELETE FROM block_data
	WHERE ctid IN (
		SELECT ctid
		FROM block_data
		WHERE chain_id = $1
			AND block_number <= $2
		FOR UPDATE SKIP LOCKED
	)`
	_, err := p.db.Exec(query, bigIntToString(chainID), bigIntToString(blockNumber))
	return err
}

// Main Storage Implementation

func (p *PostgresConnector) InsertBlockData(data []common.BlockData) error {
	if len(data) == 0 {
		return nil
	}

	// Run per-block insert concurrently; cancel on first error
	ctx, cancel := context.WithTimeout(context.Background(), InsertBlockDataTimeout)
	defer cancel()

	errCh := make(chan error, 1)
	var wg sync.WaitGroup

	// Determine a safe concurrency level
	concurrency := p.getDBConnectionConcurrencySyncBlocks(len(data))

	sem := make(chan struct{}, concurrency)

loop:
	for i := range data {
		bd := &data[i]
		select {
		case <-ctx.Done():
			break loop
		case sem <- struct{}{}:
		}

		wg.Add(1)
		go func() {
			defer wg.Done()
			defer func() { <-sem }()

			// Double-check cancel before heavy work
			select {
			case <-ctx.Done():
				return
			default:
			}

			if err := p.insertBlockAndTransactions(ctx, bd); err != nil {
				// Try to send the first error and cancel others
				select {
				case errCh <- err:
					cancel()
				default:
				}
			}
		}()
	}

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case err := <-errCh:
		// Wait for goroutines to finish cleanup before returning
		<-done
		return err
	case <-done:
		return nil
	}
}

func (p *PostgresConnector) getDBConnectionConcurrencySyncBlocks(total int) int {
	maxOpen := p.db.Stats().MaxOpenConnections
	if maxOpen <= 0 && p.cfg != nil {
		maxOpen = p.cfg.MaxOpenConns
	}
	if maxOpen <= 0 {
		maxOpen = 1
	}

	concurrency := maxOpen / 2
	if concurrency < 1 {
		concurrency = 1
	}
	if total > 0 && concurrency > total {
		concurrency = total
	}

	return concurrency
}

// insertBlockAndTransactions inserts a single block and all its transactions atomically in sequence.
func (p *PostgresConnector) insertBlockAndTransactions(ctx context.Context, blockData *common.BlockData) (err error) {
	tx, err := p.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				log.Error().Err(rbErr).Msg("failed to rollback block+txs transaction")
			}
		}
	}()

	log.Info().Str("metric", "main_storage_insert_duration").Msgf("Start inserting block %s", blockData.Block.Number.String())

	// Insert single block inside transaction
	if dbErr := p.insertBlockTx(ctx, tx, &blockData.Block); dbErr != nil {
		return dbErr
	}

	log.Info().Str("metric", "main_storage_insert_duration").Msgf("Inserting %d transactions for block %s", len(blockData.Transactions), blockData.Block.Number.String())

	// Insert all transactions for this block inside the same transaction
	var addressStats map[string]WalletStats
	if len(blockData.Transactions) > 0 {
		// Insert transactions and get affected address stats
		addressStats, err = p.insertTransactionsTx(ctx, tx, blockData.Transactions)
		if err != nil {
			return err
		}

		// Insert donation campaign feeds if any
		var userContents []common.UserContent
		for i := range blockData.Transactions {
			tx := &blockData.Transactions[i]
			if tx.TransactionType == common.TxTypeUserContent && tx.Status != nil && *tx.Status != (uint64)(pb.TransactionStatus_FAILED) {
				var userContent common.UserContent
				err := json.Unmarshal([]byte(tx.ExtraInfo), &userContent)
				if err != nil {
					continue
				}
				userContent.TxHash = tx.Hash
				userContent.CreatorAddress = tx.FromAddress
				userContent.RelatedAddress = tx.ToAddress
				userContent.CreatedAt = tx.TransactionTimestamp

				userContents = append(userContents, userContent)
			}
		}
		err = p.insertUserContentsTx(ctx, tx, userContents)
		if err != nil {
			return err
		}

		txMap := make(map[string]common.Transaction)
		offerIDMap := make(map[string]int64)
		type P2PExtraInfo struct {
			OfferID int64 `json:"offer_id"`
		}
		for i := range blockData.Transactions {
			t := blockData.Transactions[i]
			t.TransactionExtraInfoType = detectTransactionType(t.ExtraInfo)
			if t.TransactionExtraInfoType == common.TransactionExtraInfoP2PTrading && t.ExtraInfo != "" &&
				(*t.Status == (uint64)(pb.TransactionStatus_CONFIRMED) || *t.Status == (uint64)(pb.TransactionStatus_FINALIZED)) {
				txMap[t.Hash] = t
				var extra P2PExtraInfo
				if err := json.Unmarshal([]byte(t.ExtraInfo), &extra); err == nil && extra.OfferID != 0 {
					offerIDMap[t.Hash] = extra.OfferID
				}
			}
		}
		err = p.updateOfferStatus(ctx, tx, txMap, offerIDMap)
		if err != nil {
			log.Error().Err(err).Msg("Failed to update offer status after inserting transactions")
			return err
		}

	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit block+txs transaction: %w", err)
	}

	log.Info().Str("metric", "main_storage_insert_duration").Msgf("Queueing %d wallets for block %s", len(addressStats), blockData.Block.Number.String())

	for _, w := range addressStats {
		p.walletUpdateBatcher.QueueMMNServiceCall(w)
	}

	return nil
}

// insertBlockTx inserts or upsert a single block within a provided transaction and context,
// and updates the total_blocks stat if the block has transactions.
func (p *PostgresConnector) insertBlockTx(ctx context.Context, tx *sql.Tx, block *common.Block) error {
	const blockInsert = `INSERT INTO blocks (chain_id, block_number, block_timestamp, hash, parent_hash, transaction_count)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (chain_id, block_number)
			DO UPDATE SET 
				block_timestamp = EXCLUDED.block_timestamp,
				hash = EXCLUDED.hash,
				parent_hash = EXCLUDED.parent_hash,
				transaction_count = EXCLUDED.transaction_count,
				updated_at = NOW()
			RETURNING (xmax = 0) AS inserted`

	var inserted bool
	if err := tx.QueryRowContext(ctx, blockInsert,
		bigIntToString(block.ChainID),
		bigIntToString(block.Number),
		block.Timestamp,
		block.Hash,
		block.ParentHash,
		block.TransactionCount,
	).Scan(&inserted); err != nil {
		return fmt.Errorf("failed to insert block: %w", err)
	}

	if inserted && block.TransactionCount > 0 {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO stats(key, value) VALUES ('total_blocks', $1)
				ON CONFLICT (key) 
				DO UPDATE SET value = stats.value + $1
			`, 1); err != nil {
			return fmt.Errorf("failed to update total_blocks stat: %w", err)
		}
	}
	return nil
}

func (p *PostgresConnector) ReplaceBlockData(data []common.BlockData) ([]common.BlockData, error) {
	// For PostgreSQL, we'll use UPSERT (ON CONFLICT) to replace data
	// This is simpler than ClickHouse's versioned collapsing merge tree approach
	return data, p.InsertBlockData(data)
}

func (p *PostgresConnector) GetBlocks(qf *QueryFilter, fields ...string) (QueryResult[common.Block], error) {
	columns := p.buildSelectFields(fields, defaultBlockFields)
	query, args := p.buildQueryWithNamedArgs("blocks", columns, qf)
	log.Debug().Msgf("GetBlocks query: %s, args: %v", query, args)
	finalQuery, finalArgs := p.convertQueryNamedArgsToPositional(query, args)
	log.Debug().Msgf("GetBlocks final query: %s, args: %v", finalQuery, finalArgs)

	rows, err := p.db.Query(finalQuery, finalArgs...)
	if err != nil {
		return QueryResult[common.Block]{}, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetBlocks")
		}
	}()

	var blocks []common.Block
	for rows.Next() {
		var block common.Block
		err := p.scanBlock(rows, &block)
		if err != nil {
			return QueryResult[common.Block]{}, err
		}
		blocks = append(blocks, block)
	}

	return QueryResult[common.Block]{Data: blocks}, rows.Err()
}

func (p *PostgresConnector) GetTransactions(ctx context.Context, qf *QueryFilter, fields ...string) (QueryResult[common.Transaction], error) {
	columns := p.buildSelectFields(fields, defaultTransactionFields)
	query, args := p.buildQueryWithNamedArgs("transactions", columns, qf)
	log.Debug().Msgf("GetTransactions query: %s, args: %v", query, args)
	finalQuery, finalArgs := p.convertQueryNamedArgsToPositional(query, args)
	log.Debug().Msgf("GetTransactions final query: %s, args: %v", finalQuery, finalArgs)

	rows, err := p.db.QueryContext(ctx, finalQuery, finalArgs...)
	if err != nil {
		return QueryResult[common.Transaction]{}, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetTransactions")
		}
	}()

	var transactions []common.Transaction
	for rows.Next() {
		var tx common.Transaction
		err := p.scanTransaction(rows, &tx, false)
		if err != nil {
			return QueryResult[common.Transaction]{}, err
		}
		transactions = append(transactions, tx)
	}

	return QueryResult[common.Transaction]{Data: transactions}, rows.Err()
}

func (p *PostgresConnector) GetAggregations(ctx context.Context, table string, qf *QueryFilter) (QueryResult[interface{}], error) {
	if len(qf.Aggregates) == 0 {
		return QueryResult[interface{}]{}, fmt.Errorf("no aggregates specified")
	}

	query := fmt.Sprintf("SELECT %s FROM %s", strings.Join(qf.Aggregates, ", "), table)
	args := make(map[string]interface{})
	whereClause, whereArgs := p.buildWhereClauseWithNamedArgs(qf)
	if whereClause != "" {
		query += " WHERE " + whereClause
		for key, value := range whereArgs {
			args[key] = value
		}
	}

	if len(qf.GroupBy) > 0 {
		query += " GROUP BY @group_by"
		args["group_by"] = strings.Join(qf.GroupBy, ", ")
	}

	if qf.SortBy != "" && p.validateSortByColumn(table, qf.SortBy) {
		query += " ORDER BY " + qf.SortBy
		switch strings.ToUpper(qf.SortOrder) {
		case "ASC": //nolint:goconst // SQL keyword literal
			query += " ASC" //nolint:goconst // SQL keyword literal
		default:
			query += " DESC" //nolint:goconst // SQL keyword literal
		}
	}

	// Apply pagination: prefer page/limit; fallback to offset
	if qf.Page >= 0 && qf.Limit > 0 {
		query += " LIMIT @limit OFFSET @offset" //nolint:goconst // SQL clause literal
		args["limit"] = qf.Limit
		args["offset"] = qf.Page * qf.Limit
	} else if qf.Limit > 0 {
		query += " LIMIT @limit"
		args["limit"] = qf.Limit
		if qf.Offset > 0 {
			query += " OFFSET @offset"
			args["offset"] = qf.Offset
		}
	}

	finalQuery, finalArgs := p.convertQueryNamedArgsToPositional(query, args)
	log.Debug().Msgf("GetAggregations final query: %s, args: %v", finalQuery, finalArgs)
	rows, err := p.db.QueryContext(ctx, finalQuery, finalArgs...)
	if err != nil {
		return QueryResult[interface{}]{}, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetAggregations")
		}
	}()

	// Initialize as empty slice to avoid null in JSON when no rows
	var aggregates = make([]map[string]interface{}, 0)
	for rows.Next() {
		columns, err := rows.Columns()
		if err != nil {
			return QueryResult[interface{}]{}, err
		}

		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		err = rows.Scan(valuePtrs...)
		if err != nil {
			return QueryResult[interface{}]{}, err
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			// Convert PostgreSQL []byte (e.g., NUMERIC/TEXT when scanned into interface{}) to string
			if b, ok := val.([]byte); ok {
				row[col] = string(b)
			} else {
				row[col] = val
			}
		}

		aggregates = append(aggregates, row)
	}

	// Match ClickHouse behavior: populate Aggregates field and keep Data nil
	return QueryResult[interface{}]{Data: nil, Aggregates: aggregates}, rows.Err()
}

func (p *PostgresConnector) GetMaxBlockNumber(chainID *big.Int) (*big.Int, error) {
	query := `SELECT MAX(block_number) FROM blocks WHERE chain_id = $1`

	var blockNumberStr sql.NullString
	err := p.db.QueryRow(query, bigIntToString(chainID)).Scan(&blockNumberStr)
	if err != nil {
		return nil, err
	}

	if !blockNumberStr.Valid {
		return big.NewInt(0), nil
	}

	blockNumber, ok := new(big.Int).SetString(blockNumberStr.String, 10)
	if !ok {
		return nil, fmt.Errorf("failed to parse block number: %s", blockNumberStr.String)
	}

	return blockNumber, nil
}

func (p *PostgresConnector) GetMaxBlockNumberInRange(chainID, startBlock, endBlock *big.Int) (*big.Int, error) {
	query := `SELECT MAX(block_number) FROM blocks WHERE chain_id = $1 AND block_number BETWEEN $2 AND $3`

	var blockNumberStr sql.NullString
	err := p.db.QueryRow(query, bigIntToString(chainID), bigIntToString(startBlock), bigIntToString(endBlock)).Scan(&blockNumberStr)
	if err != nil {
		return nil, err
	}

	if !blockNumberStr.Valid {
		return big.NewInt(0), nil
	}

	blockNumber, ok := new(big.Int).SetString(blockNumberStr.String, 10)
	if !ok {
		return nil, fmt.Errorf("failed to parse block number: %s", blockNumberStr.String)
	}

	return blockNumber, nil
}

func (p *PostgresConnector) GetBlockHeadersDescending(chainID, from, to *big.Int) ([]common.BlockHeader, error) {
	query := `SELECT block_number, hash, parent_hash 
		FROM blocks 
		WHERE chain_id = $1 AND block_number BETWEEN $2 AND $3 
		ORDER BY block_number DESC`

	rows, err := p.db.Query(query, bigIntToString(chainID), bigIntToString(from), bigIntToString(to))
	if err != nil {
		return nil, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetBlockHeadersDescending")
		}
	}()

	var headers []common.BlockHeader
	for rows.Next() {
		var header common.BlockHeader
		var blockNumberStr string

		err := rows.Scan(&blockNumberStr, &header.Hash, &header.ParentHash)
		if err != nil {
			return nil, err
		}

		header.Number, _ = new(big.Int).SetString(blockNumberStr, 10)

		headers = append(headers, header)
	}

	return headers, rows.Err()
}

func (p *PostgresConnector) GetValidationBlockData(chainID, startBlock, endBlock *big.Int) ([]common.BlockData, error) {
	// Get blocks with minimal data for validation
	query := `SELECT chain_id, block_number, hash, parent_hash, block_timestamp 
		FROM blocks 
		WHERE chain_id = $1 AND block_number BETWEEN $2 AND $3 
		ORDER BY block_number ASC`

	rows, err := p.db.Query(query, bigIntToString(chainID), bigIntToString(startBlock), bigIntToString(endBlock))
	if err != nil {
		return nil, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetValidationBlockData")
		}
	}()

	var blockDataList []common.BlockData
	for rows.Next() {
		var block common.Block
		var chainIDStr, blockNumberStr string
		var timestamp time.Time

		err := rows.Scan(&chainIDStr, &blockNumberStr, &block.Hash, &block.ParentHash, &timestamp)
		if err != nil {
			return nil, err
		}

		block.ChainID, _ = new(big.Int).SetString(chainIDStr, 10)
		block.Number, _ = new(big.Int).SetString(blockNumberStr, 10)
		block.Timestamp = timestamp

		blockDataList = append(blockDataList, common.BlockData{
			Block:        block,
			Transactions: []common.Transaction{},
			Logs:         []common.Log{},
			Traces:       []common.Trace{},
		})
	}

	return blockDataList, rows.Err()
}

func (p *PostgresConnector) FindMissingBlockNumbers(chainID, startBlock, endBlock *big.Int) ([]*big.Int, error) {
	// Use a recursive CTE to find missing block numbers
	query := `
	WITH RECURSIVE block_sequence AS (
		SELECT $2::NUMERIC AS block_num
		UNION ALL
		SELECT block_num + 1
		FROM block_sequence
		WHERE block_num < $3::NUMERIC
	),
	existing_blocks AS (
		SELECT block_number
		FROM blocks
		WHERE chain_id = $1 AND block_number BETWEEN $2::NUMERIC AND $3::NUMERIC
	)
	SELECT bs.block_num
	FROM block_sequence bs
	LEFT JOIN existing_blocks eb ON bs.block_num = eb.block_number
	WHERE eb.block_number IS NULL
	ORDER BY bs.block_num`

	rows, err := p.db.Query(query, bigIntToString(chainID), bigIntToString(startBlock), bigIntToString(endBlock))
	if err != nil {
		return nil, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in FindMissingBlockNumbers")
		}
	}()

	var missingBlocks []*big.Int
	for rows.Next() {
		var blockNumberStr string
		err := rows.Scan(&blockNumberStr)
		if err != nil {
			return nil, err
		}

		blockNumber, ok := new(big.Int).SetString(blockNumberStr, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse block number: %s", blockNumberStr)
		}

		missingBlocks = append(missingBlocks, blockNumber)
	}

	return missingBlocks, rows.Err()
}

// GetFullBlockData retrieves full block data including transactions, logs, and traces for the specified block numbers.
// TODO: Not expose this function to the public API to avoid SQL injection - Will resolve this later
func (p *PostgresConnector) GetFullBlockData(chainID *big.Int, blockNumbers []*big.Int) ([]common.BlockData, error) {
	if len(blockNumbers) == 0 {
		return []common.BlockData{}, nil
	}

	// Convert block numbers to string slice for IN clause
	blockNumberStrs := make([]string, len(blockNumbers))
	for i, bn := range blockNumbers {
		blockNumberStrs[i] = bigIntToString(bn)
	}

	// Get blocks
	blocksQuery := fmt.Sprintf(`SELECT chain_id, block_number, hash, parent_hash, block_timestamp, transaction_count
		FROM blocks 
		WHERE chain_id = $1 AND block_number IN (%s)
		ORDER BY block_number ASC`, strings.Join(blockNumberStrs, ","))

	rows, err := p.db.Query(blocksQuery, bigIntToString(chainID))
	if err != nil {
		return nil, err
	}
	defer func() {
		closeErr := rows.Close()
		if closeErr != nil {
			log.Error().Err(closeErr).Msg("Failed to close rows in GetFullBlockData")
		}
	}()

	blockDataMap := make(map[string]*common.BlockData)
	for rows.Next() {
		var block common.Block
		var chainIDStr, blockNumberStr string
		var timestamp time.Time

		scanErr := rows.Scan(&chainIDStr, &blockNumberStr, &block.Hash, &block.ParentHash, &timestamp, &block.TransactionCount)
		if scanErr != nil {
			return nil, scanErr
		}

		block.ChainID, _ = new(big.Int).SetString(chainIDStr, 10)
		block.Number, _ = new(big.Int).SetString(blockNumberStr, 10)
		block.Timestamp = timestamp

		blockDataMap[blockNumberStr] = &common.BlockData{
			Block:        block,
			Transactions: []common.Transaction{},
			Logs:         []common.Log{},
			Traces:       []common.Trace{},
		}
	}

	// Get transactions for these blocks
	txsQuery := fmt.Sprintf(`SELECT chain_id, hash, nonce, block_hash, block_number, from_address, to_address, 
		transaction_timestamp, value, transaction_type, status, text_data, extra_info
		FROM transactions 
		WHERE chain_id = $1 AND block_number IN (%s)
		ORDER BY block_number ASC`, strings.Join(blockNumberStrs, ","))

	txRows, err := p.db.Query(txsQuery, bigIntToString(chainID))
	if err != nil {
		return nil, err
	}
	defer func() {
		err := txRows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close txRows in GetFullBlockData")
		}
	}()

	for txRows.Next() {
		var tx common.Transaction
		var chainIDStr, blockNumberStr string
		var transactionTimestamp time.Time
		var valueStr string
		var status *uint64
		var extraInfo sql.NullString

		err := txRows.Scan(&chainIDStr, &tx.Hash, &tx.Nonce, &tx.BlockHash, &blockNumberStr, &tx.FromAddress, &tx.ToAddress,
			&transactionTimestamp, &valueStr, &tx.TransactionType, &status, &tx.TextData, &extraInfo)
		if err != nil {
			return nil, err
		}

		// Convert values
		tx.ChainID, _ = new(big.Int).SetString(chainIDStr, 10)
		tx.BlockNumber, _ = new(big.Int).SetString(blockNumberStr, 10)
		tx.TransactionTimestamp = transactionTimestamp
		tx.Value = valueStr
		tx.Status = status

		if extraInfo.Valid {
			tx.ExtraInfo = extraInfo.String
		} else {
			tx.ExtraInfo = ""
		}

		if blockData, exists := blockDataMap[blockNumberStr]; exists {
			blockData.Transactions = append(blockData.Transactions, tx)
		}
	}

	// Convert map to slice in order
	var result []common.BlockData
	for _, bn := range blockNumbers {
		if blockData, exists := blockDataMap[bigIntToString(bn)]; exists {
			result = append(result, *blockData)
		}
	}

	return result, nil
}

func (p *PostgresConnector) GetCount(ctx context.Context, table string, qf *QueryFilter) (uint64, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", table)
	args := make(map[string]interface{})
	whereClause, whereArgs := p.buildWhereClauseWithNamedArgs(qf)
	if whereClause != "" {
		query += " WHERE " + whereClause
		for key, value := range whereArgs {
			args[key] = value
		}
	}
	log.Debug().Msgf("GetCount query: %s, args: %v", query, whereArgs)
	finalQuery, finalArgs := p.convertQueryNamedArgsToPositional(query, args)
	log.Debug().Msgf("GetCount final query: %s, args: %v", finalQuery, finalArgs)
	var count uint64
	err := p.db.QueryRowContext(ctx, finalQuery, finalArgs...).Scan(&count)
	return count, err
}

func (p *PostgresConnector) GetDashboardStats(ctx context.Context, qf *QueryFilter) (totalBlocks, totalTransactions, totalWallets uint64, averageBlockTime float64, totalGiveCoffee uint64, err error) {
	query := `
        SELECT 
            COALESCE(MAX(CASE WHEN key = 'total_blocks' THEN value::bigint END), 0) as blocks,
            COALESCE(MAX(CASE WHEN key = 'total_transactions' THEN value::bigint END), 0) as transactions,
            COALESCE(MAX(CASE WHEN key = 'total_wallets' THEN value::bigint END), 0) as wallets,
			COALESCE(MAX(CASE WHEN key = 'average_block' THEN value::float END) / 1000.0, 0.0) as avg_block_time,
			COALESCE(MAX(CASE WHEN key = 'total_give_coffee' THEN value::bigint END), 0) as total_give_coffee
        FROM stats
    `

	err = p.db.QueryRowContext(ctx, query).Scan(&totalBlocks, &totalTransactions, &totalWallets, &averageBlockTime, &totalGiveCoffee)
	if err != nil {
		return 0, 0, 0, 0, 0, fmt.Errorf("failed to get dashboard stats: %w", err)
	}

	return totalBlocks, totalTransactions, totalWallets, averageBlockTime, totalGiveCoffee, nil
}

func (p *PostgresConnector) GetPendingTransactions(ctx context.Context) (*pb.GetPendingTransactionsResponse, error) {
	if p.mmnGrpcService == nil {
		return nil, fmt.Errorf("MMN MMNGrpcService not initialized")
	}
	return p.mmnGrpcService.GetPendingTransactions(ctx)
}

func (p *PostgresConnector) buildSelectFields(fields, defaults []string) string {
	if len(fields) == 0 {
		return strings.Join(defaults, ", ")
	}
	return strings.Join(fields, ", ")
}

func (p *PostgresConnector) buildQueryWithNamedArgs(table, columns string, qf *QueryFilter) (query string, args map[string]interface{}) {
	query = fmt.Sprintf("SELECT %s FROM %s", columns, table)
	args = make(map[string]interface{})

	whereClause, whereArgs := p.buildWhereClauseWithNamedArgs(qf)
	if whereClause != "" {
		query += " WHERE " + whereClause
		for key, value := range whereArgs {
			args[key] = value
		}
	}

	if qf.SortBy != "" && p.validateSortByColumn(table, qf.SortBy) {
		query += " ORDER BY " + qf.SortBy
		switch strings.ToUpper(qf.SortOrder) {
		case "ASC":
			query += " ASC"
		default:
			query += " DESC"
		}
	}

	if qf.Limit > 0 {
		// Calculate offset based on page or direct offset
		var offset int
		if qf.Page >= 0 {
			offset = qf.Page * qf.Limit
		} else {
			offset = qf.Offset
		}

		// Ensure offset doesn't exceed the display limit
		maxOffset := DataRowsDisplayLimit - qf.Limit
		if offset > maxOffset {
			offset = maxOffset
		}

		query += " LIMIT @limit OFFSET @offset"
		args["limit"] = qf.Limit
		args["offset"] = offset
	}

	return query, args
}

func (p *PostgresConnector) buildWhereClauseWithNamedArgs(qf *QueryFilter) (query string, args map[string]interface{}) {
	conditions := []string{}
	args = make(map[string]interface{})

	if qf.ChainID != nil && qf.ChainID.Sign() > 0 {
		conditions = append(conditions, "chain_id = @chain_id")
		args["chain_id"] = bigIntToString(qf.ChainID)
	}

	if len(qf.BlockNumbers) > 0 {
		conditions = append(conditions, "block_number IN (@block_numbers)")
		blockNumbers := make([]string, len(qf.BlockNumbers))
		for i, bn := range qf.BlockNumbers {
			blockNumbers[i] = bigIntToString(bn)
		}
		blockNumbersArg := strings.Join(blockNumbers, ",")
		args["block_numbers"] = blockNumbersArg
	}

	if qf.StartBlock != nil && qf.EndBlock != nil {
		conditions = append(conditions, "block_number BETWEEN @start_block AND @end_block")
		args["start_block"] = bigIntToString(qf.StartBlock)
		args["end_block"] = bigIntToString(qf.EndBlock)
	}

	if qf.FromAddress != "" {
		conditions = append(conditions, "from_address = @from_address")
		args["from_address"] = qf.FromAddress
	}

	if qf.ContractAddress != "" {
		conditions = append(conditions, "to_address = @to_address")
		args["to_address"] = qf.ContractAddress
	}

	if qf.WalletAddress != "" {
		conditions = append(conditions, "(from_address = @wallet_address OR to_address = @wallet_address)")
		args["wallet_address"] = qf.WalletAddress
	}

	// Add generic filter params with operator suffix support (e.g., block_timestamp_gte)
	for key, value := range qf.FilterParams {
		if strings.TrimSpace(key) == "" || strings.TrimSpace(value) == "" {
			continue
		}
		condition, conditionKey := createPgFilterClause(key, value, args)
		conditions = append(conditions, condition)
		args[conditionKey] = value
	}

	return strings.Join(conditions, " AND "), args
}

// createPgFilterClause builds a SQL clause from a key that may include operator suffixes
// Supported suffixes: _gte, _lte, _lt, _gt, _ne, _in
func createPgFilterClause(key, value string, args map[string]interface{}) (condition, conditionKey string) {
	// Determine operator and base column name
	op := "="
	baseKey := key
	if len(key) >= 3 {
		suffix := key[len(key)-3:]
		switch suffix {
		case "gte":
			if len(key) >= 4 {
				baseKey = key[:len(key)-4]
				op = ">="
			}
		case "lte":
			if len(key) >= 4 {
				baseKey = key[:len(key)-4]
				op = "<="
			}
		case "_lt":
			baseKey = key[:len(key)-3]
			op = "<"
		case "_gt":
			baseKey = key[:len(key)-3]
			op = ">"
		case "_ne":
			baseKey = key[:len(key)-3]
			op = "!="
		case "_in":
			baseKey = key[:len(key)-3]
			// Expect value to be a comma-separated list without surrounding parentheses
			conditionKey = getNewArgumentKeyByBaseArgumentKey(baseKey, args)
			condition = fmt.Sprintf("%s IN (@%s)", baseKey, conditionKey)
			return condition, conditionKey
		default:
			// keep defaults
		}
	}

	conditionKey = getNewArgumentKeyByBaseArgumentKey(baseKey, args)
	// If the column looks like a timestamp and the value is numeric unix seconds/millis, use to_timestamp()
	if looksLikeTimestampColumn(conditionKey) && isAllDigits(value) {
		// 13+ digits likely milliseconds
		if len(value) >= 13 {
			condition = fmt.Sprintf("%s %s to_timestamp((@%s)::bigint/1000.0)", baseKey, op, conditionKey)
			return condition, conditionKey
		}
		condition = fmt.Sprintf("%s %s to_timestamp(@%s)", baseKey, op, conditionKey)
		return condition, conditionKey
	}

	condition = fmt.Sprintf("%s %s @%s", baseKey, op, conditionKey)
	return condition, conditionKey
}

func isAllDigits(s string) bool {
	if s == "" {
		return false
	}
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

func looksLikeTimestampColumn(col string) bool {
	colLower := strings.ToLower(col)
	return strings.Contains(colLower, "timestamp") || strings.HasSuffix(colLower, "_time") || strings.HasSuffix(colLower, "time")
}

func detectTransactionType(extraInfo string) common.TransactionExtraInfoType {
	type Extra struct {
		Type string `json:"type"`
	}

	var e Extra
	if err := json.Unmarshal([]byte(extraInfo), &e); err != nil {
		return common.TransactionExtraInfoTokenTransfer
	}

	return common.ParseTransactionExtraInfoType(e.Type)
}

func (p *PostgresConnector) insertTransactionsTx(
	ctx context.Context,
	tx *sql.Tx,
	transactions []common.Transaction,
) (map[string]WalletStats, error) {

	if len(transactions) == 0 {
		return nil, nil
	}

	for i := range transactions {
		t := &transactions[i]
		t.TransactionExtraInfoType = detectTransactionType(t.ExtraInfo)
	}

	valueStrings := make([]string, len(transactions))
	valueArgs := make([]interface{}, 0, len(transactions)*14)

	for i, t := range transactions {
		base := i * 14

		valueStrings[i] = fmt.Sprintf(
			"($%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d)",
			base+1, base+2, base+3, base+4, base+5,
			base+6, base+7, base+8, base+9, base+10,
			base+11, base+12, base+13, base+14,
		)

		valueArgs = append(valueArgs,
			bigIntToString(t.ChainID),
			t.Hash,
			t.Nonce,
			t.BlockHash,
			bigIntToString(t.BlockNumber),
			t.FromAddress,
			t.ToAddress,
			t.TransactionTimestamp,
			t.Value,
			t.TransactionType,
			t.Status,
			t.TextData,
			t.ExtraInfo,
			t.TransactionExtraInfoType.String(),
		)
	}

	nextIndex := len(valueArgs) + 1
	insertQuery := fmt.Sprintf(`
		WITH inserted AS (
			INSERT INTO transactions (
				chain_id, hash, nonce, block_hash, block_number,
				from_address, to_address, transaction_timestamp,
				value, transaction_type, status, text_data, extra_info, transaction_extra_info_type
			)
			VALUES %s
			ON CONFLICT (chain_id, block_number, hash)
			DO UPDATE SET
				nonce = EXCLUDED.nonce,
				block_hash = EXCLUDED.block_hash,
				from_address = EXCLUDED.from_address,
				to_address = EXCLUDED.to_address,
				transaction_timestamp = EXCLUDED.transaction_timestamp,
				value = EXCLUDED.value,
				transaction_type = EXCLUDED.transaction_type,
				status = EXCLUDED.status,
				text_data = EXCLUDED.text_data,
				extra_info = EXCLUDED.extra_info,
				transaction_extra_info_type = EXCLUDED.transaction_extra_info_type,
				updated_at = NOW()
			RETURNING 
				(xmax = 0) AS is_new,
				transaction_extra_info_type,
				status,
				extra_info
		)
		SELECT
			COUNT(*) FILTER (WHERE is_new) AS inserted_count,
			COUNT(*) FILTER (WHERE is_new AND transaction_extra_info_type IN ($%d, $%d) AND status = $%d) AS new_give_coffee
		FROM inserted;
	`, strings.Join(valueStrings, ","), nextIndex, nextIndex+1, nextIndex+2)

	var insertedCount, newGiveCoffeeCount int

	if err := tx.QueryRowContext(ctx, insertQuery, append(valueArgs, common.TransactionExtraInfoGiveCoffee.String(), common.TransactionExtraInfoDongGiveCoffee.String(), pb.TransactionStatus_FINALIZED)...).Scan(
		&insertedCount,
		&newGiveCoffeeCount,
	); err != nil {
		return nil, fmt.Errorf("failed insert tx: %w", err)
	}

	if insertedCount > 0 {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO stats(key, value)
			VALUES ('total_transactions', $1)
			ON CONFLICT (key) DO UPDATE SET value = stats.value + $1
		`, insertedCount)
		if err != nil {
			return nil, fmt.Errorf("failed update total_transactions: %w", err)
		}
	}

	if newGiveCoffeeCount > 0 {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO stats(key, value)
			VALUES ('total_give_coffee', $1)
			ON CONFLICT (key) DO UPDATE SET value = stats.value + $1
		`, newGiveCoffeeCount)
		if err != nil {
			return nil, fmt.Errorf("failed update total_give_coffee: %w", err)
		}
	}

	walletStats := make(map[string]WalletStats)

	for _, txObj := range transactions {
		apply := func(addr string) {
			if addr == "" {
				return
			}
			stat := walletStats[addr]
			stat.Address = addr
			stat.TransactionCount++
			if stat.MaxBlock == nil || txObj.BlockNumber.Cmp(stat.MaxBlock) > 0 {
				stat.MaxBlock = new(big.Int).Set(txObj.BlockNumber)
			}
			walletStats[addr] = stat
		}
		apply(txObj.FromAddress)
		apply(txObj.ToAddress)
	}

	return walletStats, nil
}

func (p *PostgresConnector) insertUserContentsTx(ctx context.Context, tx *sql.Tx, items []common.UserContent) error {
	if len(items) == 0 {
		return nil
	}

	valueStrings := make([]string, 0, len(items))
	valueArgs := make([]interface{}, 0, len(items)*11)

	for i, f := range items {
		base := i*11 + 1

		valueStrings = append(valueStrings,
			fmt.Sprintf("($%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d)",
				base, base+1, base+2, base+3, base+4,
				base+5, base+6, base+7, base+8, base+9, base+10,
			),
		)

		valueArgs = append(valueArgs,
			f.Type,
			f.TxHash,
			f.CreatorAddress,
			f.RelatedAddress,
			f.Title,
			f.Description,
			pq.Array(f.ImageCIDs),
			f.ParentHash,
			f.RootHash,
			pq.Array(f.ReferenceTxHashes),
			f.CreatedAt,
		)
	}

	query := fmt.Sprintf(`
		INSERT INTO dong_schema.user_content
		(type, tx_hash, creator_address, related_address, title, description,
		 image_cids, parent_hash, root_hash, reference_tx_hashes, created_at)
		VALUES %s
		ON CONFLICT (tx_hash) DO NOTHING`,
		strings.Join(valueStrings, ","))

	_, err := tx.ExecContext(ctx, query, valueArgs...)
	return err
}

func (p *PostgresConnector) scanBlock(rows *sql.Rows, block *common.Block) error {
	var chainIDStr, blockNumberStr string
	var timestamp time.Time

	err := rows.Scan(
		&chainIDStr, &blockNumberStr, &timestamp, &block.Hash, &block.ParentHash, &block.TransactionCount,
	)
	if err != nil {
		return err
	}

	// Convert string values to big.Int
	var ok bool
	block.ChainID, ok = new(big.Int).SetString(chainIDStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse chain_id: %s", chainIDStr)
	}

	block.Number, ok = new(big.Int).SetString(blockNumberStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse block_number: %s", blockNumberStr)
	}

	block.Timestamp = timestamp

	return nil
}

func (p *PostgresConnector) scanTransaction(rows *sql.Rows, tx *common.Transaction, isExport bool) error {
	var chainIDStr, blockNumberStr string
	var transactionTimestamp time.Time
	var valueStr string
	var status *uint64
	var extraInfo sql.NullString

	if isExport {
		if err := rows.Scan(
			&chainIDStr, &tx.Hash, &tx.Nonce, &tx.BlockHash, &blockNumberStr, &tx.FromAddress, &tx.ToAddress,
			&transactionTimestamp, &valueStr, &tx.TransactionType, &status, &tx.TextData, &tx.TransactionExtraInfoType,
		); err != nil {
			return err
		}
	} else {
		if err := rows.Scan(
			&chainIDStr, &tx.Hash, &tx.Nonce, &tx.BlockHash, &blockNumberStr, &tx.FromAddress, &tx.ToAddress,
			&transactionTimestamp, &valueStr, &tx.TransactionType, &status, &tx.TextData, &extraInfo, &tx.TransactionExtraInfoType,
		); err != nil {
			return err
		}
	}

	// Convert string values to big.Int
	var ok bool
	tx.ChainID, ok = new(big.Int).SetString(chainIDStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse chain_id: %s", chainIDStr)
	}

	tx.BlockNumber, ok = new(big.Int).SetString(blockNumberStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse block_number: %s", blockNumberStr)
	}

	tx.TransactionTimestamp = transactionTimestamp
	tx.Value = valueStr
	tx.Status = status

	if extraInfo.Valid {
		tx.ExtraInfo = extraInfo.String
	} else {
		tx.ExtraInfo = ""
	}

	return nil
}

// Helper function to safely convert *big.Int to string, handling nil values
func bigIntToString(bi *big.Int) string {
	if bi == nil {
		return "0"
	}
	return bi.String()
}

// Wallet Management
func (p *PostgresConnector) insertWallet(ctx context.Context, walletStats WalletStats, nonce uint64, balance string) error {
	if walletStats.Address == "" {
		return nil
	}

	// Convert balance string to big.Int for safe handling
	balanceBig, ok := new(big.Int).SetString(balance, 10)
	if !ok {
		balanceBig = big.NewInt(0)
	}

	tx, err := p.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				log.Error().Err(rollbackErr).Msg("Failed to rollback transaction")
			}
		}
	}()

	query := `
		WITH inserted AS (
			INSERT INTO wallet (address, account_nonce, balance, transaction_count, last_block, updated_at, created_at) 
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			ON CONFLICT (address) 
			DO UPDATE SET 
				account_nonce = EXCLUDED.account_nonce,
				balance = EXCLUDED.balance,
				transaction_count = wallet.transaction_count + EXCLUDED.transaction_count,
                last_block = GREATEST(COALESCE(wallet.last_block, 0)::numeric, EXCLUDED.last_block)::bigint,
				updated_at = NOW()
			RETURNING (xmax = 0) as is_new
		)
		SELECT COUNT(*) FROM inserted WHERE is_new = true
	`

	var newWalletCount int64
	err = tx.QueryRowContext(ctx, query, walletStats.Address, nonce, bigIntToString(balanceBig), walletStats.TransactionCount, bigIntToString(walletStats.MaxBlock)).Scan(&newWalletCount)
	if err != nil {
		return fmt.Errorf("failed to insert wallet: %w", err)
	}

	if newWalletCount > 0 {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO stats(key, value) VALUES ('total_wallets', $1)
			ON CONFLICT (key) 
			DO UPDATE SET value = stats.value + $1
		`, newWalletCount)
		if err != nil {
			return fmt.Errorf("failed to update total_wallets stat: %w", err)
		}
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// refreshWalletFromService fetches wallet data from MMN gRPC service and writes to DB
func (p *PostgresConnector) refreshWalletFromService(ctx context.Context, walletStats WalletStats) error {
	if p.mmnGrpcService == nil || walletStats.Address == "" {
		return nil
	}

	resp, err := p.mmnGrpcService.GetAccount(ctx, walletStats.Address)
	if err != nil {
		log.Error().Err(err).Str("address", walletStats.Address).Msg("Failed to get account from MMN service")
		return p.insertWallet(ctx, walletStats, 0, "0")
	}

	if resp == nil {
		return nil
	}

	return p.insertWallet(ctx, walletStats, resp.Nonce, resp.Balance)
}

func (p *PostgresConnector) GetTotalTransactions(ctx context.Context) (uint64, error) {
	query := "SELECT value FROM stats WHERE key = 'total_transactions' LIMIT 1"
	var count uint64
	err := p.db.QueryRowContext(ctx, query).Scan(&count)
	return count, err
}

// GetTransactionsByWalletPaginated retrieves paginated transactions for a wallet with sorting
func (p *PostgresConnector) GetTransactionsByWalletPaginated(ctx context.Context, walletAddress string, limit, offset int, sortOrder string, startTime, endTime int64) ([]common.Transaction, error) {
	columns := p.buildSelectFields([]string{}, defaultTransactionFields)

	// Override sort parameters to prevent SQL injection
	sortBy := "transaction_timestamp"
	switch strings.ToUpper(sortOrder) {
	case "ASC":
		sortOrder = "ASC"
	default:
		sortOrder = "DESC"
	}

	query := fmt.Sprintf(`
		(
			SELECT %s FROM transactions
			WHERE from_address = $1
            AND transaction_timestamp >= to_timestamp($5)
            AND transaction_timestamp <= to_timestamp($6)
			ORDER BY %s %s
			LIMIT $2
		)
		UNION ALL
		(
			SELECT %s FROM transactions
			WHERE to_address = $1
            AND transaction_timestamp >= to_timestamp($5)
            AND transaction_timestamp <= to_timestamp($6)
			ORDER BY %s %s
			LIMIT $2
		)
		ORDER BY %s %s
		LIMIT $3 OFFSET $4;
	`, columns, sortBy, sortOrder, columns, sortBy, sortOrder, sortBy, sortOrder)

	args := []any{walletAddress, limit + offset, limit, offset, startTime, endTime}

	// Execute optimized query
	rows, err := p.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer func() {
		closeErr := rows.Close()
		if closeErr != nil {
			log.Error().Err(closeErr).Msg("Failed to close rows in GetTransactionsByWalletPaginated")
		}
	}()

	// Initialize as empty slice to avoid null in JSON when no rows
	transactions, err := p.scanRowsToTransactions(rows, false)
	if err != nil {
		return nil, err
	}

	return transactions, rows.Err()
}

// GetTransactionsByWalletCount gets the total count of transactions for a wallet
func (p *PostgresConnector) GetTransactionsByWalletCount(ctx context.Context, walletAddress string, startTime, endTime int64) (uint64, error) {
	query := `
		SELECT COUNT(*) FROM (
			SELECT 1 FROM transactions WHERE from_address = $1
            AND transaction_timestamp >= to_timestamp($2)
            AND transaction_timestamp <= to_timestamp($3)
			UNION ALL
			SELECT 1 FROM transactions WHERE to_address = $1
            AND transaction_timestamp >= to_timestamp($2)
            AND transaction_timestamp <= to_timestamp($3)
		) AS wallet_txs
	`

	var count uint64
	err := p.db.QueryRowContext(ctx, query, walletAddress, startTime, endTime).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetTransactionsByWalletWithTimestamp retrieves transactions for a wallet with timestamp-based cursor pagination
func (p *PostgresConnector) GetTransactionsByWalletWithTimestamp(ctx context.Context, walletAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	columns := p.buildSelectFields([]string{}, defaultTransactionFields)

	fromQuery := fmt.Sprintf(
		"SELECT %s FROM transactions WHERE from_address = $1",
		columns,
	)
	toQuery := fmt.Sprintf(
		"SELECT %s FROM transactions WHERE to_address = $1",
		columns,
	)

	args := []interface{}{walletAddress}
	argIndex := 2
	var zeroTime time.Time
	if !timestampLt.Equal(zeroTime) {
		if lastHash != "" {
			fromQuery += " AND (transaction_timestamp < $2 OR (transaction_timestamp = $2 AND hash < $3))"
			toQuery += " AND (transaction_timestamp < $2 OR (transaction_timestamp = $2 AND hash < $3))"
			args = append(args, timestampLt, lastHash)
			argIndex += 2
		} else {
			fromQuery += " AND transaction_timestamp < $2"
			toQuery += " AND transaction_timestamp < $2"
			args = append(args, timestampLt)
			argIndex++
		}
	}

	fromQuery += " ORDER BY transaction_timestamp DESC, hash DESC LIMIT $" + strconv.Itoa(argIndex)
	toQuery += " ORDER BY transaction_timestamp DESC, hash DESC LIMIT $" + strconv.Itoa(argIndex)
	args = append(args, limit)

	query := fmt.Sprintf(
		"(%s) UNION ALL (%s) ORDER BY transaction_timestamp DESC, hash DESC LIMIT $%d",
		fromQuery,
		toQuery,
		argIndex+1,
	)
	args = append(args, limit)

	rows, err := p.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions, err := p.scanRowsToTransactions(rows, false)
	if err != nil {
		return nil, err
	}

	return transactions, rows.Err()
}

// GetTransactionsByFromAddressWithTimestamp retrieves transactions where the specified address is the sender
func (p *PostgresConnector) GetTransactionsByFromAddressWithTimestamp(ctx context.Context, fromAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	columns := p.buildSelectFields([]string{}, defaultTransactionFields)

	query := fmt.Sprintf(
		"SELECT %s FROM transactions WHERE from_address = $1",
		columns,
	)

	args := []interface{}{fromAddress}
	argIndex := 2
	var zeroTime time.Time
	if !timestampLt.Equal(zeroTime) {
		if lastHash != "" {
			query += " AND (transaction_timestamp < $2 OR (transaction_timestamp = $2 AND hash < $3))"
			args = append(args, timestampLt, lastHash)
			argIndex += 2
		} else {
			query += " AND transaction_timestamp < $2"
			args = append(args, timestampLt)
			argIndex++
		}
	}

	query += " ORDER BY transaction_timestamp DESC, hash DESC LIMIT $" + strconv.Itoa(argIndex)
	args = append(args, limit)

	rows, err := p.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions, err := p.scanRowsToTransactions(rows, false)
	if err != nil {
		return nil, err
	}

	return transactions, rows.Err()
}

// GetTransactionsByToAddressWithTimestamp retrieves transactions where the specified address is the receiver
func (p *PostgresConnector) GetTransactionsByToAddressWithTimestamp(ctx context.Context, toAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	columns := p.buildSelectFields([]string{}, defaultTransactionFields)

	query := fmt.Sprintf(
		"SELECT %s FROM transactions WHERE to_address = $1",
		columns,
	)

	args := []interface{}{toAddress}
	argIndex := 2
	var zeroTime time.Time
	if !timestampLt.Equal(zeroTime) {
		if lastHash != "" {
			query += " AND (transaction_timestamp < $2 OR (transaction_timestamp = $2 AND hash < $3))"
			args = append(args, timestampLt, lastHash)
			argIndex += 2
		} else {
			query += " AND transaction_timestamp < $2"
			args = append(args, timestampLt)
			argIndex++
		}
	}

	query += " ORDER BY transaction_timestamp DESC, hash DESC LIMIT $" + strconv.Itoa(argIndex)
	args = append(args, limit)

	rows, err := p.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions, err := p.scanRowsToTransactions(rows, false)
	if err != nil {
		return nil, err
	}

	return transactions, rows.Err()
}

func (p *PostgresConnector) calculateAverageBlockTime(numberOfBlocks int64) (float64, error) {
	latestQf := &QueryFilter{
		SortBy:              "block_number",
		SortOrder:           "desc",
		Limit:               1,
		ForceConsistentData: true,
	}
	latestBlocks, err := p.GetBlocks(latestQf)
	if err != nil {
		return 0, err
	}
	if len(latestBlocks.Data) == 0 {
		return 0, nil
	}

	latest := latestBlocks.Data[0]
	latestTimestamp := latest.Timestamp.Unix()
	latestBlockNumber := latest.Number.Uint64()
	k := uint64(numberOfBlocks)
	if latestBlockNumber == 0 {
		k = 0
	} else if latestBlockNumber < uint64(numberOfBlocks) {
		k = latestBlockNumber
	}
	if k <= 0 {
		return 0, nil
	}
	targetNum := int64(latestBlockNumber) - int64(k)
	targetQf := &QueryFilter{
		BlockNumbers:        []*big.Int{big.NewInt(targetNum)},
		ForceConsistentData: true,
	}

	targetBlocks, err := p.GetBlocks(targetQf)
	if err != nil {
		return 0, err
	}
	if len(targetBlocks.Data) == 0 {
		return 0, nil
	}
	timestampMinusK := targetBlocks.Data[0].Timestamp.Unix()
	avg := float64(latestTimestamp-timestampMinusK) / float64(k)

	if avg <= 0 {
		return 0, nil
	}

	return avg, nil
}

func (p *PostgresConnector) RecalculateStats(ctx context.Context) error {
	var totalBlocks int64
	var err error
	err = p.db.QueryRowContext(ctx, `
        SELECT COUNT(DISTINCT block_number) 
        FROM blocks 
        WHERE transaction_count > 0
    `).Scan(&totalBlocks)
	if err != nil {
		return fmt.Errorf("failed to count blocks: %w", err)
	}

	var totalTransactions int64
	err = p.db.QueryRowContext(ctx, `
        SELECT COUNT(*) 
        FROM transactions
    `).Scan(&totalTransactions)
	if err != nil {
		return fmt.Errorf("failed to count transactions: %w", err)
	}

	var totalWallets int64
	err = p.db.QueryRowContext(ctx, `
        SELECT COUNT(*) 
        FROM wallet
    `).Scan(&totalWallets)
	if err != nil {
		return fmt.Errorf("failed to count wallets: %w", err)
	}

	avgBlockTime, err := p.calculateAverageBlockTime(100)
	if err != nil {
		return fmt.Errorf("failed to calculate average block time: %w", err)
	}

	averageBlockMs := int64(avgBlockTime * 1000)

	var totalGiveCoffee int64
	err = p.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM transactions
		WHERE transaction_extra_info_type IN ($1, $2) AND status = $3
	`, common.TransactionExtraInfoGiveCoffee.String(), common.TransactionExtraInfoDongGiveCoffee.String(), pb.TransactionStatus_FINALIZED).Scan(&totalGiveCoffee)
	if err != nil {
		return fmt.Errorf("failed to count give_coffee transactions: %w", err)
	}

	statsUpdates := []struct {
		key   string
		value int64
	}{
		{"total_blocks", totalBlocks},
		{"total_transactions", totalTransactions},
		{"total_wallets", totalWallets},
		{"average_block", averageBlockMs},
		{"total_give_coffee", totalGiveCoffee},
	}

	for _, stat := range statsUpdates {
		_, err = p.db.ExecContext(ctx, `
            INSERT INTO stats(key, value) 
            VALUES ($1, $2)
            ON CONFLICT (key) 
            DO UPDATE SET value = $2
        `, stat.key, stat.value)
		if err != nil {
			return fmt.Errorf("failed to update %s stat: %w", stat.key, err)
		}
	}

	return nil
}

func (p *PostgresConnector) scanRowsToTransactions(rows *sql.Rows, isExport bool) ([]common.Transaction, error) {
	transactions := make([]common.Transaction, 0)

	for rows.Next() {
		var tx common.Transaction
		err := p.scanTransaction(rows, &tx, isExport)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		transactions = append(transactions, tx)
	}

	return transactions, nil
}

// Close closes the database connection
func (p *PostgresConnector) Close() error {
	if p.mmnGrpcService != nil {
		err := p.mmnGrpcService.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close MMN gRPC service")
		}
	}

	// Stop wallet update batcher
	if p.walletUpdateBatcher != nil {
		p.walletUpdateBatcher.Stop()
	}

	return p.db.Close()
}

func (p *PostgresConnector) convertQueryNamedArgsToPositional(query string, args map[string]interface{}) (finalQuery string, finalArgs []interface{}) {
	for key, value := range args {
		finalArgs = append(finalArgs, value)
		query = strings.Replace(query, "@"+key, "$"+strconv.Itoa(len(finalArgs)), 1)
	}
	return query, finalArgs
}

func (p *PostgresConnector) validateSortByColumn(table, column string) bool {
	validColumns, exists := validSortByColumns[table]
	if !exists {
		return false
	}
	for _, validColumn := range validColumns {
		if column == validColumn {
			return true
		}
	}
	return false
}

func getNewArgumentKeyByBaseArgumentKey(baseKey string, args map[string]interface{}) string {
	index := 1
	newKey := baseKey
	for {
		if _, exists := args[newKey]; !exists {
			return newKey
		}
		newKey = fmt.Sprintf("%s_%d", baseKey, index)
		index++
	}
}

func (p *PostgresConnector) GetAllTransactionsByWallet(
	ctx context.Context,
	walletAddress string,
	startTime, endTime int64,
	sortBy, sortOrder string,
) ([]common.Transaction, error) {

	columns := p.buildSelectFields([]string{}, defaultExportTransactionFields)

	if !p.validateSortByColumn("transactions", sortBy) {
		sortBy = "transaction_timestamp"
	}

	switch strings.ToUpper(sortOrder) {
	case "ASC":
		sortOrder = "ASC"
	default:
		sortOrder = "DESC"
	}

	query := fmt.Sprintf(`
		(
			SELECT %s
			FROM transactions
			WHERE from_address = $1
				AND transaction_timestamp >= to_timestamp($2)
				AND transaction_timestamp <= to_timestamp($3)
		)
		UNION ALL
		(
			SELECT %s
			FROM transactions
			WHERE to_address = $1
				AND transaction_timestamp >= to_timestamp($2)
				AND transaction_timestamp <= to_timestamp($3)
		)
		ORDER BY %s %s;
	`, columns, columns, sortBy, sortOrder)

	rows, err := p.db.QueryContext(ctx, query, walletAddress, startTime, endTime)
	if err != nil {
		return nil, err
	}

	defer func() {
		if err := rows.Close(); err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetAllTransactionsByWallet")
		}
	}()

	transactions, err := p.scanRowsToTransactions(rows, true)
	if err != nil {
		return nil, err
	}

	return transactions, rows.Err()
}

func (p *PostgresConnector) updateOfferStatus(
	ctx context.Context,
	tx *sql.Tx,
	txMap map[string]common.Transaction,
	offerIDMap map[string]int64,
) error {
	log.Info().Int("offers_to_validate", len(txMap)).Msg("starting offer status update")
	if len(txMap) == 0 {
		log.Info().Msg("no offers to validate")
		return nil
	}

	offerIDs := make([]int64, 0, len(txMap))
	for hash := range txMap {
		offerID := offerIDMap[hash]
		if offerID != 0 {
			offerIDs = append(offerIDs, offerID)
		}
	}

	if len(offerIDs) == 0 {
		log.Info().Msg("no valid offers to update")
		return nil
	}

	querySelect := `
    SELECT
        offer_id,
        seller_wallet_address,
        COALESCE(intermediary_wallet_address, ''),
        amount,
        status
    FROM dong_schema.offers
    WHERE offer_id = ANY($1::bigint[])
      AND status = 'OPEN'
    FOR UPDATE
    `

	rows, err := tx.QueryContext(ctx, querySelect, pq.Array(offerIDs))
	if err != nil {
		return fmt.Errorf("select offers for validation failed: %w", err)
	}
	defer rows.Close()

	type offerRow struct {
		OfferID            int64
		SellerWallet       string
		IntermediaryWallet string
		Amount             int64
		Status             string
	}

	offerMap := make(map[int64]offerRow)

	for rows.Next() {
		var o offerRow
		if err := rows.Scan(
			&o.OfferID,
			&o.SellerWallet,
			&o.IntermediaryWallet,
			&o.Amount,
			&o.Status,
		); err != nil {
			log.Error().Err(err).Msg("failed to scan offer row")
			return err
		}
		offerMap[o.OfferID] = o
	}

	validOfferIDs := make([]int64, 0)
	validTxHashes := make([]string, 0)

	for hash, t := range txMap {
		offerID := offerIDMap[hash]
		o, ok := offerMap[offerID]
		if !ok {
			log.Error().
				Int64("offer_id", offerID).
				Str("tx_hash", t.Hash).
				Msg("offer validation failed: offer not found or not OPEN")
			continue
		}

		if o.SellerWallet != t.FromAddress {
			log.Error().
				Int64("offer_id", offerID).
				Str("tx_hash", t.Hash).
				Msg("offer validation failed: seller wallet mismatch")
			continue
		}

		if o.IntermediaryWallet != "" && o.IntermediaryWallet != t.ToAddress {
			log.Error().
				Int64("offer_id", offerID).
				Str("tx_hash", t.Hash).
				Msg("offer validation failed: intermediary wallet mismatch")
			continue
		}

		valueInt, err := strconv.ParseInt(t.Value, 10, 64)
		if err != nil || valueInt != o.Amount*1000000 {
			log.Error().
				Int64("offer_id", offerID).
				Str("tx_hash", t.Hash).
				Msg("offer validation failed: amount mismatch")
			continue
		}
		validOfferIDs = append(validOfferIDs, offerID)
		validTxHashes = append(validTxHashes, t.Hash)
	}

	if len(validOfferIDs) == 0 {
		log.Info().Msg("no valid offers to update")
		return nil
	}

	queryUpdate := `
    UPDATE dong_schema.offers o
    SET
        status = 'CONFIRMED',
        transaction_hash = v.tx_hash,
        updated_at = NOW()
    FROM (
        SELECT
            unnest($1::bigint[]) AS offer_id,
            unnest($2::text[])   AS tx_hash
    ) v
    WHERE o.offer_id = v.offer_id
      AND o.status = 'OPEN'
    `

	_, err = tx.ExecContext(
		ctx,
		queryUpdate,
		pq.Array(validOfferIDs),
		pq.Array(validTxHashes),
	)
	if err != nil {
		return fmt.Errorf("batch update offers failed: %w", err)
	}

	log.Info().Int("offers_updated", len(validOfferIDs)).Msg("batch update offer status completed")

	return nil
}
