package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/rs/zerolog/log"
	config "github.com/thirdweb-dev/indexer/configs"
	"github.com/thirdweb-dev/indexer/internal/common"
	"github.com/thirdweb-dev/indexer/internal/rpc"
	pb "github.com/thirdweb-dev/indexer/proto"
)


type PostgresConnector struct {
	db            *sql.DB
	cfg           *config.PostgresConfig
	mmnGrpcService *rpc.MMNGrpcService
}



var defaultBlockFields = []string{
	"chain_id", "block_number", "block_timestamp", "hash", "parent_hash", "sha3_uncles",
	"nonce", "mix_hash", "miner", "state_root", "transactions_root", "receipts_root",
	"logs_bloom", "size", "extra_data", "difficulty", "total_difficulty", "transaction_count",
	"gas_limit", "gas_used", "withdrawals_root", "base_fee_per_gas",
}

var defaultTransactionFields = []string{
	"chain_id", "hash", "nonce", "block_hash", "block_number", "block_timestamp",
	"transaction_index", "from_address", "to_address", "value", "gas", "gas_price",
	"data", "function_selector", "max_fee_per_gas", "max_priority_fee_per_gas",
	"max_fee_per_blob_gas", "blob_versioned_hashes", "transaction_type", "r", "s", "v",
	"access_list", "authorization_list", "contract_address", "gas_used", "cumulative_gas_used",
	"effective_gas_price", "blob_gas_used", "blob_gas_price", "logs_bloom", "status", "transaction_timestamp", "text_data", "extra_info",
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

	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)

	if cfg.MaxConnLifetime > 0 {
		db.SetConnMaxLifetime(time.Duration(cfg.MaxConnLifetime) * time.Second)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	connector := &PostgresConnector{
		db:  db,
		cfg: cfg,
	}
	
	// Initialize MMN gRPC service if URL is provided
	if config.Cfg.RPC.MMNGRPCURL != "" {
		mmn, err := rpc.NewMMNGrpcService(config.Cfg.RPC.MMNGRPCURL)
		if err != nil {
			log.Warn().Err(err).Msg("Failed to init MMNGrpcService; wallet sync disabled")
		} else {
			connector.mmnGrpcService = mmn
		}
	}
	
	return connector, nil
}

// DB exposes the underlying *sql.DB for internal utilities like migrations.
func (p *PostgresConnector) DB() *sql.DB {
	return p.db
}

// Orchestrator Storage Implementation

func (p *PostgresConnector) GetBlockFailures(qf QueryFilter) ([]common.BlockFailure, error) {
	query := `SELECT chain_id, block_number, last_error_timestamp, failure_count, reason 
	          FROM block_failures`

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
	query := `SELECT cursor_value FROM cursors 
	          WHERE cursor_type = 'reorg' AND chain_id = $1`

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

	// Insert blocks
	blocks := make([]common.Block, len(data))
	for i, blockData := range data {
		blocks[i] = blockData.Block
	}
	if err := p.insertBlocks(blocks); err != nil {
		return err
	}

	// Insert transactions
	for _, blockData := range data {
		if len(blockData.Transactions) > 0 {
			if err := p.insertTransactions(blockData.Transactions); err != nil {
				return err
			}
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
	defer rows.Close()

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

func (p *PostgresConnector) GetTransactions(qf QueryFilter, fields ...string) (QueryResult[common.Transaction], error) {
	columns := p.buildSelectFields(fields, defaultTransactionFields)
	query := p.buildQuery("transactions", columns, qf)
	
	rows, err := p.db.Query(query)
	if err != nil {
		return QueryResult[common.Transaction]{}, err
	}
	defer rows.Close()

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
	defer rows.Close()

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
	defer rows.Close()

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

func (p *PostgresConnector) GetAggregations(table string, qf QueryFilter) (QueryResult[interface{}], error) {
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

	rows, err := p.db.Query(query)
	if err != nil {
		return QueryResult[interface{}]{}, err
	}
	defer rows.Close()

	// Initialize as empty slice to avoid null in JSON when no rows
	var aggregates []map[string]interface{} = make([]map[string]interface{}, 0)
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
	defer rows.Close()

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

func (p *PostgresConnector) GetTokenBalances(qf BalancesQueryFilter, fields ...string) (QueryResult[common.TokenBalance], error) {
	columns := p.buildSelectFields(fields, []string{
		"token_type", "chain_id", "owner", "address", "token_id", "balance",
	})
	
	query := fmt.Sprintf("SELECT %s FROM token_balances WHERE 1=1", columns)
	args := []interface{}{}
	argCount := 0

	if qf.ChainId != nil && qf.ChainId.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(qf.ChainId))
	}

	if len(qf.TokenTypes) > 0 {
		placeholders := make([]string, len(qf.TokenTypes))
		for i, tokenType := range qf.TokenTypes {
			argCount++
			placeholders[i] = fmt.Sprintf("$%d", argCount)
			args = append(args, tokenType)
		}
		query += fmt.Sprintf(" AND token_type IN (%s)", strings.Join(placeholders, ","))
	}

	if qf.TokenAddress != "" {
		argCount++
		query += fmt.Sprintf(" AND address = $%d", argCount)
		args = append(args, qf.TokenAddress)
	}

	if qf.Owner != "" {
		argCount++
		query += fmt.Sprintf(" AND owner = $%d", argCount)
		args = append(args, qf.Owner)
	}

	if len(qf.TokenIds) > 0 {
		placeholders := make([]string, len(qf.TokenIds))
		for i, tokenId := range qf.TokenIds {
			argCount++
			placeholders[i] = fmt.Sprintf("$%d", argCount)
			args = append(args, bigIntToString(tokenId))
		}
		query += fmt.Sprintf(" AND token_id IN (%s)", strings.Join(placeholders, ","))
	}

	if qf.ZeroBalance {
		query += " AND balance = 0"
	}

	if qf.SortBy != "" {
		query += fmt.Sprintf(" ORDER BY %s", qf.SortBy)
		if qf.SortOrder != "" {
			query += " " + qf.SortOrder
		}
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
		return QueryResult[common.TokenBalance]{}, err
	}
	defer rows.Close()

	var balances []common.TokenBalance
	for rows.Next() {
		var balance common.TokenBalance
		var chainIdStr, tokenIdStr, balanceStr string

		err := rows.Scan(&balance.TokenType, &chainIdStr, &balance.Owner, &balance.TokenAddress, &tokenIdStr, &balanceStr)
		if err != nil {
			return QueryResult[common.TokenBalance]{}, err
		}

		balance.ChainId, _ = new(big.Int).SetString(chainIdStr, 10)
		balance.TokenId, _ = new(big.Int).SetString(tokenIdStr, 10)
		balance.Balance, _ = new(big.Int).SetString(balanceStr, 10)

		balances = append(balances, balance)
	}

	return QueryResult[common.TokenBalance]{Data: balances}, rows.Err()
}

func (p *PostgresConnector) GetTokenTransfers(qf TransfersQueryFilter, fields ...string) (QueryResult[common.TokenTransfer], error) {
	columns := p.buildSelectFields(fields, []string{
		"token_type", "chain_id", "token_address", "from_address", "to_address", "block_number",
		"block_timestamp", "transaction_hash", "token_id", "amount", "log_index",
	})
	
	query := fmt.Sprintf("SELECT %s FROM token_transfers WHERE 1=1", columns)
	args := []interface{}{}
	argCount := 0

	if qf.ChainId != nil && qf.ChainId.Sign() > 0 {
		argCount++
		query += fmt.Sprintf(" AND chain_id = $%d", argCount)
		args = append(args, bigIntToString(qf.ChainId))
	}

	if len(qf.TokenTypes) > 0 {
		placeholders := make([]string, len(qf.TokenTypes))
		for i, tokenType := range qf.TokenTypes {
			argCount++
			placeholders[i] = fmt.Sprintf("$%d", argCount)
			args = append(args, tokenType)
		}
		query += fmt.Sprintf(" AND token_type IN (%s)", strings.Join(placeholders, ","))
	}

	if qf.TokenAddress != "" {
		argCount++
		query += fmt.Sprintf(" AND token_address = $%d", argCount)
		args = append(args, qf.TokenAddress)
	}

	if qf.WalletAddress != "" {
		argCount++
		query += fmt.Sprintf(" AND (from_address = $%d OR to_address = $%d)", argCount, argCount)
		args = append(args, qf.WalletAddress, qf.WalletAddress)
	}

	if len(qf.TokenIds) > 0 {
		placeholders := make([]string, len(qf.TokenIds))
		for i, tokenId := range qf.TokenIds {
			argCount++
			placeholders[i] = fmt.Sprintf("$%d", argCount)
			args = append(args, bigIntToString(tokenId))
		}
		query += fmt.Sprintf(" AND token_id IN (%s)", strings.Join(placeholders, ","))
	}

	if qf.TransactionHash != "" {
		argCount++
		query += fmt.Sprintf(" AND transaction_hash = $%d", argCount)
		args = append(args, qf.TransactionHash)
	}

	if qf.StartBlockNumber != nil && qf.EndBlockNumber != nil {
		argCount++
		query += fmt.Sprintf(" AND block_number BETWEEN $%d AND $%d", argCount, argCount+1)
		args = append(args, bigIntToString(qf.StartBlockNumber), bigIntToString(qf.EndBlockNumber))
		argCount++ // Increment once more since we used two args
	}

	if qf.SortBy != "" {
		query += fmt.Sprintf(" ORDER BY %s", qf.SortBy)
		if qf.SortOrder != "" {
			query += " " + qf.SortOrder
		}
	} else {
		query += " ORDER BY block_number DESC, log_index ASC"
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
		return QueryResult[common.TokenTransfer]{}, err
	}
	defer rows.Close()

	var transfers []common.TokenTransfer
	for rows.Next() {
		var transfer common.TokenTransfer
		var chainIdStr, blockNumberStr, tokenIdStr, amountStr string
		var timestamp time.Time

		err := rows.Scan(&transfer.TokenType, &chainIdStr, &transfer.TokenAddress, &transfer.FromAddress, 
			&transfer.ToAddress, &blockNumberStr, &timestamp, &transfer.TransactionHash, 
			&tokenIdStr, &amountStr, &transfer.LogIndex)
		if err != nil {
			return QueryResult[common.TokenTransfer]{}, err
		}

		transfer.ChainID, _ = new(big.Int).SetString(chainIdStr, 10)
		transfer.BlockNumber, _ = new(big.Int).SetString(blockNumberStr, 10)
		transfer.BlockTimestamp = timestamp
		transfer.TokenID, _ = new(big.Int).SetString(tokenIdStr, 10)
		transfer.Amount, _ = new(big.Int).SetString(amountStr, 10)

		transfers = append(transfers, transfer)
	}

	return QueryResult[common.TokenTransfer]{Data: transfers}, rows.Err()
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
	defer rows.Close()

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
	defer rows.Close()

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
	blocksQuery := fmt.Sprintf(`SELECT chain_id, block_number, hash, parent_hash, block_timestamp, nonce,
		sha3_uncles, mix_hash, miner, state_root, transactions_root, receipts_root, logs_bloom,
		size, extra_data, difficulty, total_difficulty, transaction_count, gas_limit, gas_used,
		withdrawals_root, base_fee_per_gas
		FROM blocks 
		WHERE chain_id = $1 AND block_number IN (%s)
		ORDER BY block_number ASC`, strings.Join(blockNumberStrs, ","))

	rows, err := p.db.Query(blocksQuery, bigIntToString(chainId))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	blockDataMap := make(map[string]*common.BlockData)
	for rows.Next() {
		var block common.Block
		var chainIdStr, blockNumberStr string
		var timestamp time.Time
		var difficultyStr, totalDifficultyStr, gasLimitStr, gasUsedStr string
		var baseFeePerGas *int64

		err := rows.Scan(&chainIdStr, &blockNumberStr, &block.Hash, &block.ParentHash, &timestamp, &block.Nonce,
			&block.Sha3Uncles, &block.MixHash, &block.Miner, &block.StateRoot, &block.TransactionsRoot,
			&block.ReceiptsRoot, &block.LogsBloom, &block.Size, &block.ExtraData, &difficultyStr,
			&totalDifficultyStr, &block.TransactionCount, &gasLimitStr, &gasUsedStr, &block.WithdrawalsRoot,
			&baseFeePerGas)
		if err != nil {
			return nil, err
		}

		block.ChainId, _ = new(big.Int).SetString(chainIdStr, 10)
		block.Number, _ = new(big.Int).SetString(blockNumberStr, 10)
		block.Timestamp = timestamp
		block.Difficulty, _ = new(big.Int).SetString(difficultyStr, 10)
		block.TotalDifficulty, _ = new(big.Int).SetString(totalDifficultyStr, 10)
		block.GasLimit, _ = new(big.Int).SetString(gasLimitStr, 10)
		block.GasUsed, _ = new(big.Int).SetString(gasUsedStr, 10)
		if baseFeePerGas != nil {
			block.BaseFeePerGas = uint64(*baseFeePerGas)
		}

		blockDataMap[blockNumberStr] = &common.BlockData{
			Block:        block,
			Transactions: []common.Transaction{},
			Logs:         []common.Log{},
			Traces:       []common.Trace{},
		}
	}

	// Get transactions for these blocks
	txsQuery := fmt.Sprintf(`SELECT chain_id, hash, nonce, block_hash, block_number, block_timestamp,
		transaction_index, from_address, to_address, value, gas, gas_price, data, function_selector,
		max_fee_per_gas, max_priority_fee_per_gas, max_fee_per_blob_gas, blob_versioned_hashes,
		transaction_type, r, s, v, access_list, authorization_list, contract_address, gas_used,
		cumulative_gas_used, effective_gas_price, blob_gas_used, blob_gas_price, logs_bloom, status,
		transaction_timestamp, text_data, extra_info
		FROM transactions 
		WHERE chain_id = $1 AND block_number IN (%s)
		ORDER BY block_number ASC, transaction_index ASC`, strings.Join(blockNumberStrs, ","))

	txRows, err := p.db.Query(txsQuery, bigIntToString(chainId))
	if err != nil {
		return nil, err
	}
	defer txRows.Close()

	for txRows.Next() {
		var tx common.Transaction
		var chainIdStr, blockNumberStr string
		var timestamp, transactionTimestamp time.Time
		var valueStr, gasPriceStr, maxFeePerGasStr, maxPriorityFeePerGasStr, maxFeePerBlobGasStr string
		var rStr, sStr, vStr, effectiveGasPriceStr, blobGasPriceStr string
		var blobVersionedHashesStr string
		var gasUsed, cumulativeGasUsed, blobGasUsed *uint64
		var status *uint64
		var extraInfo sql.NullString

		err := txRows.Scan(&chainIdStr, &tx.Hash, &tx.Nonce, &tx.BlockHash, &blockNumberStr, &timestamp,
			&tx.TransactionIndex, &tx.FromAddress, &tx.ToAddress, &valueStr, &tx.Gas, &gasPriceStr,
			&tx.Data, &tx.FunctionSelector, &maxFeePerGasStr, &maxPriorityFeePerGasStr,
			&maxFeePerBlobGasStr, &blobVersionedHashesStr, &tx.TransactionType, &rStr, &sStr, &vStr,
			&tx.AccessListJson, &tx.AuthorizationListJson, &tx.ContractAddress, &gasUsed, &cumulativeGasUsed,
			&effectiveGasPriceStr, &blobGasUsed, &blobGasPriceStr, &tx.LogsBloom, &status,
			&transactionTimestamp, &tx.TextData, &extraInfo)
		if err != nil {
			return nil, err
		}

		// Convert values (simplified - in real implementation, handle all conversions)
		tx.ChainId, _ = new(big.Int).SetString(chainIdStr, 10)
		tx.BlockNumber, _ = new(big.Int).SetString(blockNumberStr, 10)
		tx.BlockTimestamp = timestamp
		tx.TransactionTimestamp = transactionTimestamp
		tx.Value = valueStr
		tx.GasPrice, _ = new(big.Int).SetString(gasPriceStr, 10)
		tx.MaxFeePerGas, _ = new(big.Int).SetString(maxFeePerGasStr, 10)
		tx.MaxPriorityFeePerGas, _ = new(big.Int).SetString(maxPriorityFeePerGasStr, 10)
		tx.MaxFeePerBlobGas, _ = new(big.Int).SetString(maxFeePerBlobGasStr, 10)
		tx.R, _ = new(big.Int).SetString(rStr, 10)
		tx.S, _ = new(big.Int).SetString(sStr, 10)
		tx.V, _ = new(big.Int).SetString(vStr, 10)
		tx.EffectiveGasPrice, _ = new(big.Int).SetString(effectiveGasPriceStr, 10)
		tx.BlobGasPrice, _ = new(big.Int).SetString(blobGasPriceStr, 10)

		tx.GasUsed = gasUsed
		tx.CumulativeGasUsed = cumulativeGasUsed
		tx.BlobGasUsed = blobGasUsed
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

func (p *PostgresConnector) GetDashboardStats(ctx context.Context, qf QueryFilter) (totalBlocks uint64, totalTransactions uint64, totalWallets uint64, err error) {
	blockWhereClause := "transaction_count > 0"
	if qf.ChainId != nil && qf.ChainId.Sign() > 0 {
		blockWhereClause += fmt.Sprintf(" AND chain_id = %s", bigIntToString(qf.ChainId))
	}

	walletWhereClause := ""
	if qf.ChainId != nil && qf.ChainId.Sign() > 0 {
		walletWhereClause = fmt.Sprintf("WHERE chain_id = %s", bigIntToString(qf.ChainId))
	}

	query := fmt.Sprintf(`
		SELECT 'blocks' as stat_type, COUNT(*) as count FROM blocks WHERE %s
		UNION ALL
		SELECT 'transactions' as stat_type, value as count FROM stats WHERE key = 'total_transactions'
		UNION ALL
		SELECT 'wallets' as stat_type, COUNT(*) as count FROM wallet %s
	`, blockWhereClause, walletWhereClause)

	rows, err := p.db.QueryContext(ctx, query)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to execute dashboard stats query: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var statType string
		var count uint64
		
		err := rows.Scan(&statType, &count)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("failed to scan dashboard stats row: %w", err)
		}
		
		switch statType {
		case "blocks":
			totalBlocks = count
		case "transactions":
			totalTransactions = count
		case "wallets":
			totalWallets = count
		}
	}
	
	if err = rows.Err(); err != nil {
		return 0, 0, 0, fmt.Errorf("error iterating dashboard stats rows: %w", err)
	}
	
	return totalBlocks, totalTransactions, totalWallets, nil
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
	
	// Prefer page/limit pagination; fallback to raw offset if provided
	if qf.Page >= 0 && qf.Limit > 0 {
		offset := qf.Page * qf.Limit
		query += fmt.Sprintf(" LIMIT %d OFFSET %d", qf.Limit, offset)
	} else if qf.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", qf.Limit)
		if qf.Offset > 0 {
			query += fmt.Sprintf(" OFFSET %d", qf.Offset)
		}
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

func (p *PostgresConnector) insertBlocks(blocks []common.Block) error {
	if len(blocks) == 0 {
		return nil
	}

	valueStrings := make([]string, 0, len(blocks))
	valueArgs := make([]interface{}, 0, len(blocks)*22)

	for i, block := range blocks {
		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)",
			i*22+1, i*22+2, i*22+3, i*22+4, i*22+5, i*22+6, i*22+7, i*22+8, i*22+9, i*22+10,
			i*22+11, i*22+12, i*22+13, i*22+14, i*22+15, i*22+16, i*22+17, i*22+18, i*22+19, i*22+20, i*22+21, i*22+22))
		valueArgs = append(valueArgs,
			bigIntToString(block.ChainId),
			bigIntToString(block.Number),
			block.Timestamp,
			block.Hash,
			block.ParentHash,
			block.Sha3Uncles,
			block.Nonce,
			block.MixHash,
			block.Miner,
			block.StateRoot,
			block.TransactionsRoot,
			block.ReceiptsRoot,
			block.LogsBloom,
			block.Size,
			block.ExtraData,
			bigIntToString(block.Difficulty),
			bigIntToString(block.TotalDifficulty),
			block.TransactionCount,
			bigIntToString(block.GasLimit),
			bigIntToString(block.GasUsed),
			block.WithdrawalsRoot,
			block.BaseFeePerGas,
		)
	}

	query := fmt.Sprintf(`INSERT INTO blocks (chain_id, block_number, block_timestamp, hash, parent_hash, sha3_uncles, nonce, mix_hash, miner, state_root, transactions_root, receipts_root, logs_bloom, size, extra_data, difficulty, total_difficulty, transaction_count, gas_limit, gas_used, withdrawals_root, base_fee_per_gas)
	          VALUES %s
	          ON CONFLICT (chain_id, block_number) 
	          DO UPDATE SET 
	              block_timestamp = EXCLUDED.block_timestamp,
	              hash = EXCLUDED.hash,
	              parent_hash = EXCLUDED.parent_hash,
	              sha3_uncles = EXCLUDED.sha3_uncles,
	              nonce = EXCLUDED.nonce,
	              mix_hash = EXCLUDED.mix_hash,
	              miner = EXCLUDED.miner,
	              state_root = EXCLUDED.state_root,
	              transactions_root = EXCLUDED.transactions_root,
	              receipts_root = EXCLUDED.receipts_root,
	              logs_bloom = EXCLUDED.logs_bloom,
	              size = EXCLUDED.size,
	              extra_data = EXCLUDED.extra_data,
	              difficulty = EXCLUDED.difficulty,
	              total_difficulty = EXCLUDED.total_difficulty,
	              transaction_count = EXCLUDED.transaction_count,
	              gas_limit = EXCLUDED.gas_limit,
	              gas_used = EXCLUDED.gas_used,
	              withdrawals_root = EXCLUDED.withdrawals_root,
	              base_fee_per_gas = EXCLUDED.base_fee_per_gas,
	              updated_at = NOW()`, strings.Join(valueStrings, ","))

	_, err := p.db.Exec(query, valueArgs...)
	return err
}

func (p *PostgresConnector) insertTransactions(transactions []common.Transaction) error {
	if len(transactions) == 0 {
		return nil
	}

	valueStrings := make([]string, 0, len(transactions))
	valueArgs := make([]interface{}, 0, len(transactions)*35)

	for i, tx := range transactions {
		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)",
			i*35+1, i*35+2, i*35+3, i*35+4, i*35+5, i*35+6, i*35+7, i*35+8, i*35+9, i*35+10,
			i*35+11, i*35+12, i*35+13, i*35+14, i*35+15, i*35+16, i*35+17, i*35+18, i*35+19, i*35+20,
			i*35+21, i*35+22, i*35+23, i*35+24, i*35+25, i*35+26, i*35+27, i*35+28, i*35+29, i*35+30,
			i*35+31, i*35+32, i*35+33, i*35+34, i*35+35))
		
		// Convert arrays to PostgreSQL format
		blobHashes := make([]string, len(tx.BlobVersionedHashes))
		for j, hash := range tx.BlobVersionedHashes {
			blobHashes[j] = hash
		}

		valueArgs = append(valueArgs,
			bigIntToString(tx.ChainId),
			tx.Hash,
			tx.Nonce,
			tx.BlockHash,
			bigIntToString(tx.BlockNumber),
			tx.BlockTimestamp,
			tx.TransactionIndex,
			tx.FromAddress,
			tx.ToAddress,
			tx.Value,
			tx.Gas,
			bigIntToString(tx.GasPrice),
			tx.Data,
			tx.FunctionSelector,
			bigIntToString(tx.MaxFeePerGas),
			bigIntToString(tx.MaxPriorityFeePerGas),
			bigIntToString(tx.MaxFeePerBlobGas),
			fmt.Sprintf("{%s}", strings.Join(blobHashes, ",")), // PostgreSQL array format
			tx.TransactionType,
			bigIntToString(tx.R),
			bigIntToString(tx.S),
			bigIntToString(tx.V),
			tx.AccessListJson,
			tx.AuthorizationListJson,
			tx.ContractAddress,
			tx.GasUsed,
			tx.CumulativeGasUsed,
			bigIntToString(tx.EffectiveGasPrice),
			tx.BlobGasUsed,
			bigIntToString(tx.BlobGasPrice),
			tx.LogsBloom,
			tx.Status,
			tx.TransactionTimestamp,
			tx.TextData,
			tx.ExtraInfo,
		)
		
		// Refresh wallet data from MMN service (non-blocking)
		go func() {
			ctx := context.Background()
			_ = p.refreshWalletFromService(ctx, tx.FromAddress)
			_ = p.refreshWalletFromService(ctx, tx.ToAddress)
		}()
	}

	tx, err := p.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	insertTransactionsQuery := fmt.Sprintf(`INSERT INTO transactions (chain_id, hash, nonce, block_hash, block_number, block_timestamp, transaction_index, from_address, to_address, value, gas, gas_price, data, function_selector, max_fee_per_gas, max_priority_fee_per_gas, max_fee_per_blob_gas, blob_versioned_hashes, transaction_type, r, s, v, access_list, authorization_list, contract_address, gas_used, cumulative_gas_used, effective_gas_price, blob_gas_used, blob_gas_price, logs_bloom, status, transaction_timestamp, text_data, extra_info)
	          VALUES %s
	          ON CONFLICT (chain_id, block_number, hash) 
	          DO UPDATE SET 
	              nonce = EXCLUDED.nonce,
	              block_hash = EXCLUDED.block_hash,
	              block_timestamp = EXCLUDED.block_timestamp,
	              transaction_index = EXCLUDED.transaction_index,
	              from_address = EXCLUDED.from_address,
	              to_address = EXCLUDED.to_address,
	              value = EXCLUDED.value,
	              gas = EXCLUDED.gas,
	              gas_price = EXCLUDED.gas_price,
	              data = EXCLUDED.data,
	              function_selector = EXCLUDED.function_selector,
	              max_fee_per_gas = EXCLUDED.max_fee_per_gas,
	              max_priority_fee_per_gas = EXCLUDED.max_priority_fee_per_gas,
	              max_fee_per_blob_gas = EXCLUDED.max_fee_per_blob_gas,
	              blob_versioned_hashes = EXCLUDED.blob_versioned_hashes,
	              transaction_type = EXCLUDED.transaction_type,
	              r = EXCLUDED.r,
	              s = EXCLUDED.s,
	              v = EXCLUDED.v,
	              access_list = EXCLUDED.access_list,
	              authorization_list = EXCLUDED.authorization_list,
	              contract_address = EXCLUDED.contract_address,
	              gas_used = EXCLUDED.gas_used,
	              cumulative_gas_used = EXCLUDED.cumulative_gas_used,
	              effective_gas_price = EXCLUDED.effective_gas_price,
	              blob_gas_used = EXCLUDED.blob_gas_used,
	              blob_gas_price = EXCLUDED.blob_gas_price,
	              logs_bloom = EXCLUDED.logs_bloom,
	              status = EXCLUDED.status,
	              transaction_timestamp = EXCLUDED.transaction_timestamp,
	              text_data = EXCLUDED.text_data,
	              extra_info = EXCLUDED.extra_info,
	              updated_at = NOW()`, strings.Join(valueStrings, ","))
	_, err = tx.Exec(insertTransactionsQuery, valueArgs...)
	if err != nil {
		return fmt.Errorf("failed to execute insert transactions query: %w", err)
	}

	txCount := len(transactions)
	if txCount > 0 {
		updateStatsQuery := "INSERT INTO stats(key, value) VALUES ('total_transactions', 0) ON CONFLICT (key) DO UPDATE SET value = stats.value + $1"
		_, err = tx.Exec(updateStatsQuery, txCount)
		if err != nil {
			return fmt.Errorf("failed to execute update stats query: %w", err)
		}
	}

	addresses := make(map[string]int64)
	for _, tx := range transactions {
		if tx.FromAddress != "" {
			addresses[tx.FromAddress] = addresses[tx.FromAddress] + 1
		}
		if tx.ToAddress != "" {
			addresses[tx.ToAddress] = addresses[tx.ToAddress] + 1
		}
	}

	for address := range addresses {
		
		incrementWalletTxCountQuery := `INSERT INTO wallet(address, transaction_count) VALUES ($1, $2)
		ON CONFLICT (address) 
		DO UPDATE 
			SET transaction_count = COALESCE(wallet.transaction_count, 0) + $2`
		_, err = tx.Exec(incrementWalletTxCountQuery, address, addresses[address])
		if err != nil {
			return fmt.Errorf("failed to update transaction_count for wallet %s: %w", address, err)
		}
	}
	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (p *PostgresConnector) scanBlock(rows *sql.Rows, block *common.Block) error {
	var chainIdStr, blockNumberStr string
	var timestamp time.Time
	var difficultyStr, totalDifficultyStr, gasLimitStr, gasUsedStr string
	var baseFeePerGas *int64

	err := rows.Scan(
		&chainIdStr, &blockNumberStr, &timestamp, &block.Hash, &block.ParentHash, &block.Sha3Uncles,
		&block.Nonce, &block.MixHash, &block.Miner, &block.StateRoot, &block.TransactionsRoot,
		&block.ReceiptsRoot, &block.LogsBloom, &block.Size, &block.ExtraData, &difficultyStr,
		&totalDifficultyStr, &block.TransactionCount, &gasLimitStr, &gasUsedStr, &block.WithdrawalsRoot,
		&baseFeePerGas,
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

	block.Difficulty, ok = new(big.Int).SetString(difficultyStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse difficulty: %s", difficultyStr)
	}

	block.TotalDifficulty, ok = new(big.Int).SetString(totalDifficultyStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse total_difficulty: %s", totalDifficultyStr)
	}

	block.GasLimit, ok = new(big.Int).SetString(gasLimitStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse gas_limit: %s", gasLimitStr)
	}

	block.GasUsed, ok = new(big.Int).SetString(gasUsedStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse gas_used: %s", gasUsedStr)
	}

	if baseFeePerGas != nil {
		block.BaseFeePerGas = uint64(*baseFeePerGas)
	}

	return nil
}

func (p *PostgresConnector) scanTransaction(rows *sql.Rows, tx *common.Transaction) error {
	var chainIdStr, blockNumberStr string
	var timestamp, transactionTimestamp time.Time
	var valueStr, gasPriceStr, maxFeePerGasStr, maxPriorityFeePerGasStr, maxFeePerBlobGasStr string
	var rStr, sStr, vStr, effectiveGasPriceStr, blobGasPriceStr string
	var blobVersionedHashesStr string
	var gasUsed, cumulativeGasUsed, blobGasUsed *uint64
	var status *uint64
	var extraInfo sql.NullString

	err := rows.Scan(
		&chainIdStr, &tx.Hash, &tx.Nonce, &tx.BlockHash, &blockNumberStr, &timestamp,
		&tx.TransactionIndex, &tx.FromAddress, &tx.ToAddress, &valueStr, &tx.Gas, &gasPriceStr,
		&tx.Data, &tx.FunctionSelector, &maxFeePerGasStr, &maxPriorityFeePerGasStr,
		&maxFeePerBlobGasStr, &blobVersionedHashesStr, &tx.TransactionType, &rStr, &sStr, &vStr,
		&tx.AccessListJson, &tx.AuthorizationListJson, &tx.ContractAddress, &gasUsed, &cumulativeGasUsed,
		&effectiveGasPriceStr, &blobGasUsed, &blobGasPriceStr, &tx.LogsBloom, &status,
		&transactionTimestamp, &tx.TextData, &extraInfo,
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

	tx.BlockTimestamp = timestamp
	tx.TransactionTimestamp = transactionTimestamp

	tx.Value = valueStr

	tx.GasPrice, ok = new(big.Int).SetString(gasPriceStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse gas_price: %s", gasPriceStr)
	}

	tx.MaxFeePerGas, ok = new(big.Int).SetString(maxFeePerGasStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse max_fee_per_gas: %s", maxFeePerGasStr)
	}

	tx.MaxPriorityFeePerGas, ok = new(big.Int).SetString(maxPriorityFeePerGasStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse max_priority_fee_per_gas: %s", maxPriorityFeePerGasStr)
	}

	tx.MaxFeePerBlobGas, ok = new(big.Int).SetString(maxFeePerBlobGasStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse max_fee_per_blob_gas: %s", maxFeePerBlobGasStr)
	}

	tx.R, ok = new(big.Int).SetString(rStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse r: %s", rStr)
	}

	tx.S, ok = new(big.Int).SetString(sStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse s: %s", sStr)
	}

	tx.V, ok = new(big.Int).SetString(vStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse v: %s", vStr)
	}

	tx.EffectiveGasPrice, ok = new(big.Int).SetString(effectiveGasPriceStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse effective_gas_price: %s", effectiveGasPriceStr)
	}

	tx.BlobGasPrice, ok = new(big.Int).SetString(blobGasPriceStr, 10)
	if !ok {
		return fmt.Errorf("failed to parse blob_gas_price: %s", blobGasPriceStr)
	}

	// Parse blob versioned hashes array
	if blobVersionedHashesStr != "" {
		// Remove curly braces and split by comma
		hashStr := strings.Trim(blobVersionedHashesStr, "{}")
		if hashStr != "" {
			tx.BlobVersionedHashes = strings.Split(hashStr, ",")
		}
	}

	// Set optional fields
	tx.GasUsed = gasUsed
	tx.CumulativeGasUsed = cumulativeGasUsed
	tx.BlobGasUsed = blobGasUsed
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

// Helper function to convert int64 slice to string slice
func convertInt64SliceToStringSlice(slice []int64) []string {
	result := make([]string, len(slice))
	for i, v := range slice {
		result[i] = fmt.Sprintf("%d", v)
	}
	return result
}

// Helper function to safely convert *big.Int to string, handling nil values
func bigIntToString(bi *big.Int) string {
	if bi == nil {
		return "0"
	}
	return bi.String()
}

// Helper function to safely convert *big.Int to string for nullable fields
func bigIntToNullableString(bi *big.Int) *string {
	if bi == nil {
		return nil
	}
	s := bi.String()
	return &s
}

// Wallet Management

func (p *PostgresConnector) insertWallet(ctx context.Context, address string, nonce uint64, balance string) error {
	if address == "" {
		return nil
	}
	
	// Convert balance string to big.Int for safe handling
	balanceBig, ok := new(big.Int).SetString(balance, 10)
	if !ok {
		balanceBig = big.NewInt(0)
	}

	query := `INSERT INTO wallet (address, account_nonce, balance, transaction_count, updated_at, created_at) 
	          VALUES ($1, $2, $3, 0, NOW(), NOW())
	          ON CONFLICT (address) 
	          DO UPDATE SET 
	              account_nonce = EXCLUDED.account_nonce,
	              balance = EXCLUDED.balance,
	              updated_at = NOW()`
	
	_, err := p.db.ExecContext(ctx, query, address, nonce, bigIntToString(balanceBig))
	return err
}

// refreshWalletFromService fetches wallet data from MMN gRPC service and writes to DB
func (p *PostgresConnector) refreshWalletFromService(ctx context.Context, address string) error {
	if p.mmnGrpcService == nil || address == "" {
		return nil
	}
	
	resp, err := p.mmnGrpcService.GetAccountByAddress(ctx, address)
	if err != nil {
		return err
	}
	
	if resp == nil || resp.Account == nil {
		return nil
	}
	
	return p.insertWallet(ctx, address, resp.Account.Nonce, resp.Account.Balance)
}

// GetWallet retrieves wallet information by address
func (p *PostgresConnector) GetWallet(address string) (*common.Wallet, error) {
	query := `SELECT address, account_nonce, balance, updated_at, created_at 
	          FROM wallet WHERE address = $1`
	
	var wallet common.Wallet
	var balanceStr string
	var nonce *uint64
	
	err := p.db.QueryRow(query, address).Scan(
		&wallet.Address,
		&nonce,
		&balanceStr,
		&wallet.UpdatedAt,
		&wallet.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Wallet not found
		}
		return nil, err
	}
	
	wallet.AccountNonce = nonce
	
	// Convert balance string to big.Int
	balance, ok := new(big.Int).SetString(balanceStr, 10)
	if !ok {
		balance = big.NewInt(0)
	}
	wallet.Balance = balance
	
	return &wallet, nil
}

// GetWallets retrieves wallets with pagination and filtering
func (p *PostgresConnector) GetWallets(limit, offset int, sortBy, sortOrder string) ([]common.Wallet, error) {
	query := `SELECT address, account_nonce, balance, updated_at, created_at 
	          FROM wallet`
	
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
	defer rows.Close()
	
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

// Close closes the database connection
func (p *PostgresConnector) Close() error {
	if p.mmnGrpcService != nil {
		p.mmnGrpcService.Close()
	}
	return p.db.Close()
}
