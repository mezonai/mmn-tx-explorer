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

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
)

const DATA_ROWS_DISPLAY_LIMIT = 500000
const InsertBlockDataTimeout = 10 * time.Minute

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
	"transaction_timestamp", "value", "transaction_type", "status", "text_data", "extra_info",
}

var defaultLogFields = []string{
	"chain_id", "block_number", "block_hash", "block_timestamp", "transaction_hash",
	"transaction_index", "log_index", "address", "data", "topic_0", "topic_1", "topic_2", "topic_3",
}

var defaultTraceFields = []string{
	"chain_id", "block_number", "block_hash", "block_timestamp", "transaction_hash",
	"transaction_index", "subtraces", "trace_address", "type", "call_type", "error",
	"from_address", "to_address", "gas", "gas_used", "input", "output", "value", "author",
	"reward_type", "refund_address",
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

// GetCampaignWallet checks if a specific wallet address exists in dong_schema.donation_campaign table
func (p *PostgresConnector) GetCampaignWallet(ctx context.Context, address string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM dong_schema.donation_campaign WHERE donation_wallet = $1)"
	var exists bool
	err := p.db.QueryRowContext(ctx, query, address).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check campaign wallet: %w", err)
	}

	return exists, nil
}

// Orchestrator Storage Implementation

func (p *PostgresConnector) GetBlockFailures(qf QueryFilter) ([]common.BlockFailure, error) {
	query := `SELECT chain_id, block_number, last_error_timestamp, failure_count, reason FROM block_failures`

	args := []interface{}{}
	argCount := 0

	if qf.ChainId != nil && qf.ChainId.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(qf.ChainId))
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
		var chainIdStr, blockNumberStr string
		var timestamp int64
		var count int

		// NUMERIC columns are scanned as strings by pq driver
		err := rows.Scan(&chainIdStr, &blockNumberStr, &timestamp, &count, &failure.FailureReason)
		if err != nil {
			return nil, fmt.Errorf("error scanning block failure: %w", err)
		}

		// Convert NUMERIC string to big.Int
		var ok bool
		failure.ChainId, ok = new(big.Int).SetString(chainIdStr, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse chain_id '%s' as big.Int", chainIdStr)
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
			bigIntToString(failure.ChainId),
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
		args = append(args, bigIntToString(failure.ChainId), bigIntToString(failure.BlockNumber))
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

func (p *PostgresConnector) GetLastReorgCheckedBlockNumber(chainId *big.Int) (*big.Int, error) {
	query := `SELECT cursor_value FROM cursors WHERE cursor_type = 'reorg' AND chain_id = $1`

	var blockNumberString string
	err := p.db.QueryRow(query, bigIntToString(chainId)).Scan(&blockNumberString)
	if err != nil {
		return nil, err
	}

	blockNumber, ok := new(big.Int).SetString(blockNumberString, 10)
	if !ok {
		return nil, fmt.Errorf("failed to parse block number: %s", blockNumberString)
	}

	return blockNumber, nil
}

func (p *PostgresConnector) SetLastReorgCheckedBlockNumber(chainId *big.Int, blockNumber *big.Int) error {
	query := `INSERT INTO cursors (chain_id, cursor_type, cursor_value)
			VALUES ($1, 'reorg', $2)
			ON CONFLICT (chain_id, cursor_type) 
			DO UPDATE SET cursor_value = EXCLUDED.cursor_value, updated_at = NOW()`

	_, err := p.db.Exec(query, bigIntToString(chainId), bigIntToString(blockNumber))
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

	for i, blockData := range data {
		blockDataJSON, err := json.Marshal(blockData)
		if err != nil {
			return err
		}

		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d)",
			i*3+1, i*3+2, i*3+3))
		valueArgs = append(valueArgs,
			bigIntToString(blockData.Block.ChainId),
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

func (p *PostgresConnector) GetStagingData(qf QueryFilter) ([]common.BlockData, error) {
	// No need to check is_deleted since we're using hard deletes for staging data
	query := `SELECT data FROM block_data WHERE 1=1`

	args := []interface{}{}
	argCount := 0

	if qf.ChainId != nil && qf.ChainId.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(qf.ChainId))
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
		var blockDataJson string
		if err := rows.Scan(&blockDataJson); err != nil {
			return nil, fmt.Errorf("error scanning block data: %w", err)
		}

		var blockData common.BlockData
		if err := json.Unmarshal([]byte(blockDataJson), &blockData); err != nil {
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

	for i, blockData := range data {
		tuples = append(tuples, fmt.Sprintf("($%d, $%d)", i*2+1, i*2+2))
		args = append(args, bigIntToString(blockData.Block.ChainId), bigIntToString(blockData.Block.Number))
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

func (p *PostgresConnector) GetLastPublishedBlockNumber(chainId *big.Int) (*big.Int, error) {
	query := `SELECT cursor_value FROM cursors WHERE cursor_type = 'publish' AND chain_id = $1`

	var blockNumberString string
	err := p.db.QueryRow(query, bigIntToString(chainId)).Scan(&blockNumberString)
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

func (p *PostgresConnector) SetLastPublishedBlockNumber(chainId *big.Int, blockNumber *big.Int) error {
	query := `INSERT INTO cursors (chain_id, cursor_type, cursor_value)
				VALUES ($1, 'publish', $2)
				ON CONFLICT (chain_id, cursor_type)
				DO UPDATE SET cursor_value = EXCLUDED.cursor_value, updated_at = NOW()`

	_, err := p.db.Exec(query, bigIntToString(chainId), bigIntToString(blockNumber))
	return err
}

func (p *PostgresConnector) GetLastStagedBlockNumber(chainId *big.Int, rangeStart *big.Int, rangeEnd *big.Int) (*big.Int, error) {
	query := `SELECT MAX(block_number) FROM block_data WHERE 1=1`

	args := []interface{}{}
	argCount := 0

	if chainId != nil && chainId.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(chainId))
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

func (p *PostgresConnector) DeleteOlderThan(chainId *big.Int, blockNumber *big.Int) error {
	query := `DELETE FROM block_data
	WHERE ctid IN (
		SELECT ctid
		FROM block_data
		WHERE chain_id = $1
			AND block_number <= $2
		FOR UPDATE SKIP LOCKED
	)`
	_, err := p.db.Exec(query, bigIntToString(chainId), bigIntToString(blockNumber))
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
	concurrency := p.getDbConnectionConcurrencySyncBlocks(len(data))

	sem := make(chan struct{}, concurrency)

loop:
	for _, blockData := range data {
		bd := blockData // capture loop variable
		// Respect cancellation before acquiring a slot
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

func (p *PostgresConnector) getDbConnectionConcurrencySyncBlocks(total int) int {
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
func (p *PostgresConnector) insertBlockAndTransactions(ctx context.Context, blockData common.BlockData) (err error) {
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

	// Insert single block inside transaction
	if err = p.insertBlockTx(ctx, tx, blockData.Block); err != nil {
		return err
	}

	// Insert all transactions for this block inside the same transaction
	var addressStats map[string]WalletStats
	if len(blockData.Transactions) > 0 {
		addressStats, err = p.insertTransactionsTx(ctx, tx, blockData.Transactions)
		if err != nil {
			return err
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit block+txs transaction: %w", err)
	}

	for _, w := range addressStats {
		p.walletUpdateBatcher.QueueMMNServiceCall(w)
	}

	return nil
}

// insertBlockTx inserts or upsert a single block within a provided transaction and context,
// and updates the total_blocks stat if the block has transactions.
func (p *PostgresConnector) insertBlockTx(ctx context.Context, tx *sql.Tx, block common.Block) error {
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
		bigIntToString(block.ChainId),
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

func (p *PostgresConnector) GetBlocks(qf QueryFilter, fields ...string) (QueryResult[common.Block], error) {
	columns := p.buildSelectFields(fields, defaultBlockFields)
	query := p.buildQuery("blocks", columns, qf)

	rows, err := p.db.Query(query)
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

func (p *PostgresConnector) GetTransactions(ctx context.Context, qf QueryFilter, fields ...string) (QueryResult[common.Transaction], error) {
	columns := p.buildSelectFields(fields, defaultTransactionFields)
	query := p.buildQuery("transactions", columns, qf)

	rows, err := p.db.QueryContext(ctx, query)
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
		err := p.scanTransaction(rows, &tx)
		if err != nil {
			return QueryResult[common.Transaction]{}, err
		}
		transactions = append(transactions, tx)
	}

	return QueryResult[common.Transaction]{Data: transactions}, rows.Err()
}

func (p *PostgresConnector) GetLogs(qf QueryFilter, fields ...string) (QueryResult[common.Log], error) {
	columns := p.buildSelectFields(fields, defaultLogFields)
	query := p.buildQuery("logs", columns, qf)

	rows, err := p.db.Query(query)
	if err != nil {
		return QueryResult[common.Log]{}, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetLogs")
		}
	}()

	var logs []common.Log
	for rows.Next() {
		var log common.Log
		err := p.scanLog(rows, &log)
		if err != nil {
			return QueryResult[common.Log]{}, err
		}
		logs = append(logs, log)
	}

	return QueryResult[common.Log]{Data: logs}, rows.Err()
}

func (p *PostgresConnector) GetTraces(qf QueryFilter, fields ...string) (QueryResult[common.Trace], error) {
	columns := p.buildSelectFields(fields, defaultTraceFields)
	query := p.buildQuery("traces", columns, qf)

	rows, err := p.db.Query(query)
	if err != nil {
		return QueryResult[common.Trace]{}, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetTraces")
		}
	}()

	var traces []common.Trace
	for rows.Next() {
		var trace common.Trace
		err := p.scanTrace(rows, &trace)
		if err != nil {
			return QueryResult[common.Trace]{}, err
		}
		traces = append(traces, trace)
	}

	return QueryResult[common.Trace]{Data: traces}, rows.Err()
}

func (p *PostgresConnector) GetAggregations(ctx context.Context, table string, qf QueryFilter) (QueryResult[interface{}], error) {
	if len(qf.Aggregates) == 0 {
		return QueryResult[interface{}]{}, fmt.Errorf("no aggregates specified")
	}

	query := fmt.Sprintf("SELECT %s FROM %s", strings.Join(qf.Aggregates, ", "), table)
	whereClause := p.buildWhereClause(qf)
	if whereClause != "" {
		query += " WHERE " + whereClause
	}

	if len(qf.GroupBy) > 0 {
		query += " GROUP BY " + strings.Join(qf.GroupBy, ", ")
	}

	if qf.SortBy != "" {
		query += fmt.Sprintf(" ORDER BY %s", qf.SortBy)
		if qf.SortOrder != "" {
			query += " " + qf.SortOrder
		}
	}

	// Apply pagination: prefer page/limit; fallback to offset
	if qf.Page >= 0 && qf.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d OFFSET %d", qf.Limit, qf.Page*qf.Limit)
	} else if qf.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", qf.Limit)
		if qf.Offset > 0 {
			query += fmt.Sprintf(" OFFSET %d", qf.Offset)
		}
	}

	rows, err := p.db.QueryContext(ctx, query)
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

func (p *PostgresConnector) GetMaxBlockNumber(chainId *big.Int) (*big.Int, error) {
	query := `SELECT MAX(block_number) FROM blocks WHERE chain_id = $1`

	var blockNumberStr sql.NullString
	err := p.db.QueryRow(query, bigIntToString(chainId)).Scan(&blockNumberStr)
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

func (p *PostgresConnector) GetMaxBlockNumberInRange(chainId *big.Int, startBlock *big.Int, endBlock *big.Int) (*big.Int, error) {
	query := `SELECT MAX(block_number) FROM blocks WHERE chain_id = $1 AND block_number BETWEEN $2 AND $3`

	var blockNumberStr sql.NullString
	err := p.db.QueryRow(query, bigIntToString(chainId), bigIntToString(startBlock), bigIntToString(endBlock)).Scan(&blockNumberStr)
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

func (p *PostgresConnector) GetBlockHeadersDescending(chainId *big.Int, from *big.Int, to *big.Int) ([]common.BlockHeader, error) {
	query := `SELECT block_number, hash, parent_hash 
		FROM blocks 
		WHERE chain_id = $1 AND block_number BETWEEN $2 AND $3 
		ORDER BY block_number DESC`

	rows, err := p.db.Query(query, bigIntToString(chainId), bigIntToString(from), bigIntToString(to))
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

func (p *PostgresConnector) GetValidationBlockData(chainId *big.Int, startBlock *big.Int, endBlock *big.Int) ([]common.BlockData, error) {
	// Get blocks with minimal data for validation
	query := `SELECT chain_id, block_number, hash, parent_hash, block_timestamp 
		FROM blocks 
		WHERE chain_id = $1 AND block_number BETWEEN $2 AND $3 
		ORDER BY block_number ASC`

	rows, err := p.db.Query(query, bigIntToString(chainId), bigIntToString(startBlock), bigIntToString(endBlock))
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
		var chainIdStr, blockNumberStr string
		var timestamp time.Time

		err := rows.Scan(&chainIdStr, &blockNumberStr, &block.Hash, &block.ParentHash, &timestamp)
		if err != nil {
			return nil, err
		}

		block.ChainId, _ = new(big.Int).SetString(chainIdStr, 10)
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

func (p *PostgresConnector) FindMissingBlockNumbers(chainId *big.Int, startBlock *big.Int, endBlock *big.Int) ([]*big.Int, error) {
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

	rows, err := p.db.Query(query, bigIntToString(chainId), bigIntToString(startBlock), bigIntToString(endBlock))
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

func (p *PostgresConnector) GetFullBlockData(chainId *big.Int, blockNumbers []*big.Int) ([]common.BlockData, error) {
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

	rows, err := p.db.Query(blocksQuery, bigIntToString(chainId))
	if err != nil {
		return nil, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetFullBlockData")
		}
	}()

	blockDataMap := make(map[string]*common.BlockData)
	for rows.Next() {
		var block common.Block
		var chainIdStr, blockNumberStr string
		var timestamp time.Time

		err := rows.Scan(&chainIdStr, &blockNumberStr, &block.Hash, &block.ParentHash, &timestamp, &block.TransactionCount)
		if err != nil {
			return nil, err
		}

		block.ChainId, _ = new(big.Int).SetString(chainIdStr, 10)
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

	txRows, err := p.db.Query(txsQuery, bigIntToString(chainId))
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
		var chainIdStr, blockNumberStr string
		var transactionTimestamp time.Time
		var valueStr string
		var status *uint64
		var extraInfo sql.NullString

		err := txRows.Scan(&chainIdStr, &tx.Hash, &tx.Nonce, &tx.BlockHash, &blockNumberStr, &tx.FromAddress, &tx.ToAddress,
			&transactionTimestamp, &valueStr, &tx.TransactionType, &status, &tx.TextData, &extraInfo)
		if err != nil {
			return nil, err
		}

		// Convert values
		tx.ChainId, _ = new(big.Int).SetString(chainIdStr, 10)
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

func (p *PostgresConnector) GetCount(ctx context.Context, table string, qf QueryFilter) (uint64, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", table)
	whereClause := p.buildWhereClause(qf)
	if whereClause != "" {
		query += " WHERE " + whereClause
	}

	var count uint64
	err := p.db.QueryRowContext(ctx, query).Scan(&count)
	return count, err
}

func (p *PostgresConnector) GetDashboardStats(ctx context.Context, qf QueryFilter) (totalBlocks uint64, totalTransactions uint64, totalWallets uint64, averageBlockTime float64, err error) {
	query := `
        SELECT 
            COALESCE(MAX(CASE WHEN key = 'total_blocks' THEN value::bigint END), 0) as blocks,
            COALESCE(MAX(CASE WHEN key = 'total_transactions' THEN value::bigint END), 0) as transactions,
            COALESCE(MAX(CASE WHEN key = 'total_wallets' THEN value::bigint END), 0) as wallets,
            COALESCE(MAX(CASE WHEN key = 'average_block' THEN value::float END) / 1000.0, 0.0) as avg_block_time
        FROM stats
    `

	err = p.db.QueryRowContext(ctx, query).Scan(&totalBlocks, &totalTransactions, &totalWallets, &averageBlockTime)
	if err != nil {
		return 0, 0, 0, 0, fmt.Errorf("failed to get dashboard stats: %w", err)
	}

	return totalBlocks, totalTransactions, totalWallets, averageBlockTime, nil
}

func (p *PostgresConnector) GetPendingTransactions(ctx context.Context) (*pb.GetPendingTransactionsResponse, error) {
	if p.mmnGrpcService == nil {
		return nil, fmt.Errorf("MMN MMNGrpcService not initialized")
	}
	return p.mmnGrpcService.GetPendingTransactions(ctx)
}

func (p *PostgresConnector) buildSelectFields(fields []string, defaults []string) string {
	if len(fields) == 0 {
		return strings.Join(defaults, ", ")
	}
	return strings.Join(fields, ", ")
}

func (p *PostgresConnector) buildQuery(table, columns string, qf QueryFilter) string {
	query := fmt.Sprintf("SELECT %s FROM %s", columns, table)
	whereClause := p.buildWhereClause(qf)
	if whereClause != "" {
		query += " WHERE " + whereClause
	}

	if qf.SortBy != "" {
		query += fmt.Sprintf(" ORDER BY %s", qf.SortBy)
		if qf.SortOrder != "" {
			query += " " + qf.SortOrder
		}
	}

	// Apply pagination with safety limits
	if qf.Limit > 0 {
		// Calculate offset based on page or direct offset
		var offset int
		if qf.Page >= 0 {
			offset = qf.Page * qf.Limit
		} else {
			offset = qf.Offset
		}

		// Ensure offset doesn't exceed the display limit
		maxOffset := DATA_ROWS_DISPLAY_LIMIT - qf.Limit
		if offset > maxOffset {
			offset = maxOffset
		}

		// Apply limit and offset
		query += fmt.Sprintf(" LIMIT %d OFFSET %d", qf.Limit, offset)
	}

	return query
}

func (p *PostgresConnector) buildWhereClause(qf QueryFilter) string {
	var conditions []string

	if qf.ChainId != nil && qf.ChainId.Sign() > 0 {
		conditions = append(conditions, fmt.Sprintf("chain_id = %s", bigIntToString(qf.ChainId)))
	}

	if len(qf.BlockNumbers) > 0 {
		blockNumbers := make([]string, len(qf.BlockNumbers))
		for i, bn := range qf.BlockNumbers {
			blockNumbers[i] = bigIntToString(bn)
		}
		conditions = append(conditions, fmt.Sprintf("block_number IN (%s)", strings.Join(blockNumbers, ",")))
	}

	if qf.StartBlock != nil && qf.EndBlock != nil {
		conditions = append(conditions, fmt.Sprintf("block_number BETWEEN %s AND %s", bigIntToString(qf.StartBlock), bigIntToString(qf.EndBlock)))
	}

	if qf.FromAddress != "" {
		conditions = append(conditions, fmt.Sprintf("from_address = '%s'", qf.FromAddress))
	}

	if qf.ContractAddress != "" {
		conditions = append(conditions, fmt.Sprintf("to_address = '%s'", qf.ContractAddress))
	}

	if qf.WalletAddress != "" {
		conditions = append(conditions, fmt.Sprintf("(from_address = '%s' OR to_address = '%s')", qf.WalletAddress, qf.WalletAddress))
	}

	// Add generic filter params with operator suffix support (e.g., block_timestamp_gte)
	for key, value := range qf.FilterParams {
		if strings.TrimSpace(key) == "" || strings.TrimSpace(value) == "" {
			continue
		}
		conditions = append(conditions, createPgFilterClause(key, value))
	}

	return strings.Join(conditions, " AND ")
}

// createPgFilterClause builds a SQL clause from a key that may include operator suffixes
// Supported suffixes: _gte, _lte, _lt, _gt, _ne, _in
func createPgFilterClause(key, value string) string {
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
			return fmt.Sprintf("%s IN (%s)", baseKey, value)
		default:
			// keep defaults
		}
	}

	// If the column looks like a timestamp and the value is numeric unix seconds/millis, use to_timestamp()
	if looksLikeTimestampColumn(baseKey) && isAllDigits(value) {
		// 13+ digits likely milliseconds
		if len(value) >= 13 {
			return fmt.Sprintf("%s %s to_timestamp((%s)::bigint/1000.0)", baseKey, op, value)
		}
		return fmt.Sprintf("%s %s to_timestamp(%s)", baseKey, op, value)
	}

	return fmt.Sprintf("%s %s '%s'", baseKey, op, value)
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

func (p *PostgresConnector) insertTransactionsTx(ctx context.Context, tx *sql.Tx, transactions []common.Transaction) (map[string]WalletStats, error) {
	if len(transactions) == 0 {
		return nil, nil
	}

	valueStrings := make([]string, 0, len(transactions))
	valueArgs := make([]interface{}, 0, len(transactions)*13)

	for i, t := range transactions {
		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)",
			i*13+1, i*13+2, i*13+3, i*13+4, i*13+5, i*13+6, i*13+7, i*13+8, i*13+9, i*13+10, i*13+11, i*13+12, i*13+13))

		valueArgs = append(valueArgs,
			bigIntToString(t.ChainId),
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
		)
	}

	insertTransactionsQuery := fmt.Sprintf(`WITH inserted AS (
                INSERT INTO transactions (chain_id, hash, nonce, block_hash, block_number, from_address, to_address, transaction_timestamp, value, transaction_type, status, text_data, extra_info)
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
                    updated_at = NOW()
                RETURNING (xmax = 0) AS is_new
            )
            SELECT COUNT(*) FROM inserted WHERE is_new`, strings.Join(valueStrings, ","))

	// Count only newly inserted rows to compute accurate stats increment
	var insertedCount int
	if err := tx.QueryRowContext(ctx, insertTransactionsQuery, valueArgs...).Scan(&insertedCount); err != nil {
		return nil, fmt.Errorf("failed to execute insert transactions count query: %w", err)
	}

	if insertedCount > 0 {
		if _, err := tx.ExecContext(ctx, "INSERT INTO stats(key, value) VALUES ('total_transactions', $1) ON CONFLICT (key) DO UPDATE SET value = stats.value + $1", insertedCount); err != nil {
			return nil, fmt.Errorf("failed to execute update stats query: %w", err)
		}
	}

	addressStats := make(map[string]WalletStats)
	for _, t := range transactions {
		if t.FromAddress != "" {
			stat := addressStats[t.FromAddress]
			stat.Address = t.FromAddress
			stat.TransactionCount++
			if stat.MaxBlock == nil || t.BlockNumber.Cmp(stat.MaxBlock) > 0 {
				stat.MaxBlock = new(big.Int).Set(t.BlockNumber)
			}
			addressStats[t.FromAddress] = stat
		}
		if t.ToAddress != "" {
			stat := addressStats[t.ToAddress]
			stat.Address = t.ToAddress
			stat.TransactionCount++
			if stat.MaxBlock == nil || t.BlockNumber.Cmp(stat.MaxBlock) > 0 {
				stat.MaxBlock = new(big.Int).Set(t.BlockNumber)
			}
			addressStats[t.ToAddress] = stat
		}
	}

	return addressStats, nil
}

func (p *PostgresConnector) scanBlock(rows *sql.Rows, block *common.Block) error {
	var chainIdStr, blockNumberStr string
	var timestamp time.Time

	err := rows.Scan(
		&chainIdStr, &blockNumberStr, &timestamp, &block.Hash, &block.ParentHash, &block.TransactionCount,
	)
	if err != nil {
		return err
	}

	// Convert string values to big.Int
	var ok bool
	block.ChainId, ok = new(big.Int).SetString(chainIdStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse chain_id: %s", chainIdStr)
	}

	block.Number, ok = new(big.Int).SetString(blockNumberStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse block_number: %s", blockNumberStr)
	}

	block.Timestamp = timestamp

	return nil
}

func (p *PostgresConnector) scanTransaction(rows *sql.Rows, tx *common.Transaction) error {
	var chainIdStr, blockNumberStr string
	var transactionTimestamp time.Time
	var valueStr string
	var status *uint64
	var extraInfo sql.NullString

	err := rows.Scan(
		&chainIdStr, &tx.Hash, &tx.Nonce, &tx.BlockHash, &blockNumberStr, &tx.FromAddress, &tx.ToAddress,
		&transactionTimestamp, &valueStr, &tx.TransactionType, &status, &tx.TextData, &extraInfo,
	)
	if err != nil {
		return err
	}

	// Convert string values to big.Int
	var ok bool
	tx.ChainId, ok = new(big.Int).SetString(chainIdStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse chain_id: %s", chainIdStr)
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

func (p *PostgresConnector) scanLog(rows *sql.Rows, log *common.Log) error {
	var chainIdStr, blockNumberStr string
	var timestamp time.Time

	err := rows.Scan(
		&chainIdStr, &blockNumberStr, &log.BlockHash, &timestamp, &log.TransactionIndex,
		&log.LogIndex, &log.Address, &log.Data, &log.Topic0, &log.Topic1, &log.Topic2, &log.Topic3,
	)
	if err != nil {
		return err
	}

	// Convert string values to big.Int
	var ok bool
	log.ChainId, ok = new(big.Int).SetString(chainIdStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse chain_id: %s", chainIdStr)
	}

	log.BlockNumber, ok = new(big.Int).SetString(blockNumberStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse block_number: %s", blockNumberStr)
	}

	log.BlockTimestamp = timestamp

	return nil
}

func (p *PostgresConnector) scanTrace(rows *sql.Rows, trace *common.Trace) error {
	var chainIdStr, blockNumberStr string
	var timestamp time.Time
	var valueStr string
	var traceAddressStr string

	err := rows.Scan(
		&chainIdStr, &blockNumberStr, &trace.BlockHash, &timestamp, &trace.TransactionHash,
		&trace.TransactionIndex, &trace.Subtraces, &traceAddressStr, &trace.TraceType, &trace.CallType,
		&trace.Error, &trace.FromAddress, &trace.ToAddress, &trace.Gas, &trace.GasUsed,
		&trace.Input, &trace.Output, &valueStr, &trace.Author, &trace.RewardType, &trace.RefundAddress,
	)
	if err != nil {
		return err
	}

	// Convert string values to big.Int
	var ok bool
	trace.ChainID, ok = new(big.Int).SetString(chainIdStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse chain_id: %s", chainIdStr)
	}

	trace.BlockNumber, ok = new(big.Int).SetString(blockNumberStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse block_number: %s", blockNumberStr)
	}

	trace.BlockTimestamp = timestamp

	trace.Value, ok = new(big.Int).SetString(valueStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse value: %s", valueStr)
	}

	// Parse trace address array
	if traceAddressStr != "" {
		// Remove curly braces and split by comma
		addressStr := strings.Trim(traceAddressStr, "{}")
		if addressStr != "" {
			addressParts := strings.Split(addressStr, ",")
			trace.TraceAddress = make([]int64, len(addressParts))
			for i, part := range addressParts {
				val, err := strconv.ParseInt(strings.TrimSpace(part), 10, 64)
				if err != nil {
					return fmt.Errorf("failed to parse trace_address[%d]: %s", i, part)
				}
				trace.TraceAddress[i] = val
			}
		}
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

// GetWallets retrieves wallets with pagination and filtering
func (p *PostgresConnector) GetWallets(limit, offset int, sortBy, sortOrder string) ([]common.Wallet, error) {
	query := `SELECT address, account_nonce, balance, updated_at, created_at FROM wallet`

	if sortBy != "" {
		query += fmt.Sprintf(" ORDER BY %s", sortBy)
		if sortOrder != "" {
			query += " " + sortOrder
		}
	} else {
		query += " ORDER BY balance DESC"
	}

	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
	}

	if offset > 0 {
		query += fmt.Sprintf(" OFFSET %d", offset)
	}

	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer func() {
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetWallets")
		}
	}()

	var wallets []common.Wallet
	for rows.Next() {
		var wallet common.Wallet
		var balanceStr string
		var nonce *uint64

		err := rows.Scan(
			&wallet.Address,
			&nonce,
			&balanceStr,
			&wallet.UpdatedAt,
			&wallet.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		wallet.AccountNonce = nonce

		// Convert balance string to big.Int
		balance, ok := new(big.Int).SetString(balanceStr, 10)
		if !ok {
			balance = big.NewInt(0)
		}
		wallet.Balance = balance

		wallets = append(wallets, wallet)
	}

	return wallets, rows.Err()
}

func (p *PostgresConnector) GetTotalTransactions(ctx context.Context) (uint64, error) {
	query := "SELECT value FROM stats WHERE key = 'total_transactions' LIMIT 1"
	var count uint64
	err := p.db.QueryRowContext(ctx, query).Scan(&count)
	return count, err
}

// GetTransactionsByWalletPaginated retrieves paginated transactions for a wallet with sorting
func (p *PostgresConnector) GetTransactionsByWalletPaginated(ctx context.Context, walletAddress string, limit, offset int, sortBy, sortOrder string, startTime, endTime int64) ([]common.Transaction, error) {
	columns := p.buildSelectFields([]string{}, defaultTransactionFields)

	// Validate sort parameters
	if sortBy == "" {
		sortBy = "transaction_timestamp"
	}
	if sortOrder == "" {
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
		err := rows.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close rows in GetTransactionsByWalletPaginated")
		}
	}()

	// Initialize as empty slice to avoid null in JSON when no rows
	transactions, err := p.scanRowsToTransactions(rows)
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

func (p *PostgresConnector) calculateAverageBlockTime(ctx context.Context, numberOfBlocks int64) (float64, error) {
	latestQf := QueryFilter{
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
	targetQf := QueryFilter{
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

	avgBlockTime, err := p.calculateAverageBlockTime(ctx, 100)
	if err != nil {
		return fmt.Errorf("failed to calculate average block time: %w", err)
	}

	averageBlockMs := int64(avgBlockTime * 1000)

	statsUpdates := []struct {
		key   string
		value int64
	}{
		{"total_blocks", totalBlocks},
		{"total_transactions", totalTransactions},
		{"total_wallets", totalWallets},
		{"average_block", averageBlockMs},
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

func (p *PostgresConnector) scanRowsToTransactions(rows *sql.Rows) ([]common.Transaction, error) {
	transactions := make([]common.Transaction, 0)

	for rows.Next() {
		var tx common.Transaction
		err := p.scanTransaction(rows, &tx)
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
