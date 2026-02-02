package storage

import (
	"context"
	"math/big"
	"sync"
	"time"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
)

type DualStorage struct {
	postgres   *PostgresConnector
	clickhouse *ClickHouseConnector
}

func NewDualStorage(postgres *PostgresConnector, clickhouse *ClickHouseConnector) *DualStorage {
	return &DualStorage{
		postgres:   postgres,
		clickhouse: clickhouse,
	}
}

// InsertBlockData writes to both storages in parallel
func (d *DualStorage) InsertBlockData(data []common.BlockData) error {
	var g errgroup.Group

	// Write to Postgres
	g.Go(func() error {
		return d.postgres.InsertBlockData(data)
	})

	// Write to ClickHouse
	g.Go(func() error {
		// Log error but don't fail the entire operation if ClickHouse fails (optional strategy)
		// For now, we return error to be strict
		if err := d.clickhouse.InsertBlockData(data); err != nil {
			log.Error().Err(err).Msg("Failed to insert block data into ClickHouse")
			return err
		}
		return nil
	})

	return g.Wait()
}

// ReplaceBlockData writes to both storages
func (d *DualStorage) ReplaceBlockData(data []common.BlockData) ([]common.BlockData, error) {
	// For replacement/reorg, we want consistency first.
	// 1. Replace in Postgres (Source of Truth)
	result, err := d.postgres.ReplaceBlockData(data)
	if err != nil {
		return nil, err
	}

	// 2. Async/Sync update to ClickHouse
	// ClickHouse Replace is tricky (ReplacingMergeTree handles deduplication, but deletes need specific handling)
	// For now, we just insert new data which will have newer version (updated_at)
	if err := d.clickhouse.InsertBlockData(data); err != nil {
		log.Error().Err(err).Msg("Failed to update block data in ClickHouse during Reorg")
		// We don't block return here because Postgres succeeded
	}

	return result, nil
}

// GetBlocks reads from ClickHouse (Optimized)
func (d *DualStorage) GetBlocks(qf *QueryFilter, fields ...string) (QueryResult[common.Block], error) {
	return d.clickhouse.GetBlocks(qf, fields...)
}

// GetTransactions reads from Postgres (default)
func (d *DualStorage) GetTransactions(ctx context.Context, qf *QueryFilter, fields ...string) (QueryResult[common.Transaction], error) {
	// Potential optimization: Read from ClickHouse if query is suitable (e.g. analytics, range queries)
	return d.postgres.GetTransactions(ctx, qf, fields...)
}

// GetAggregations reads from ClickHouse (Optimized for Analytics)
func (d *DualStorage) GetAggregations(ctx context.Context, table string, qf *QueryFilter) (QueryResult[interface{}], error) {
	return d.clickhouse.GetAggregations(ctx, table, qf)
}

// GetMaxBlockNumber reads from Postgres (Source of Truth)
func (d *DualStorage) GetMaxBlockNumber(chainID *big.Int) (*big.Int, error) {
	return d.postgres.GetMaxBlockNumber(chainID)
}

func (d *DualStorage) GetMaxBlockNumberInRange(chainID *big.Int, startBlock *big.Int, endBlock *big.Int) (*big.Int, error) {
	return d.postgres.GetMaxBlockNumberInRange(chainID, startBlock, endBlock)
}

func (d *DualStorage) GetBlockHeadersDescending(chainID *big.Int, from *big.Int, to *big.Int) ([]common.BlockHeader, error) {
	return d.postgres.GetBlockHeadersDescending(chainID, from, to)
}

func (d *DualStorage) GetValidationBlockData(chainID *big.Int, startBlock *big.Int, endBlock *big.Int) ([]common.BlockData, error) {
	return d.postgres.GetValidationBlockData(chainID, startBlock, endBlock)
}

func (d *DualStorage) FindMissingBlockNumbers(chainID *big.Int, startBlock *big.Int, endBlock *big.Int) ([]*big.Int, error) {
	return d.postgres.FindMissingBlockNumbers(chainID, startBlock, endBlock)
}

func (d *DualStorage) GetFullBlockData(chainID *big.Int, blockNumbers []*big.Int) ([]common.BlockData, error) {
	return d.postgres.GetFullBlockData(chainID, blockNumbers)
}

func (d *DualStorage) GetCount(ctx context.Context, table string, qf *QueryFilter) (uint64, error) {
	// Count is faster in ClickHouse
	return d.clickhouse.GetCount(ctx, table, qf)
}

func (d *DualStorage) GetDashboardStats(ctx context.Context, qf *QueryFilter) (uint64, uint64, uint64, float64, uint64, float64, uint64, error) {
	// Analytics -> ClickHouse
	return d.clickhouse.GetDashboardStats(ctx, qf)
}

func (d *DualStorage) GetPendingTransactions(ctx context.Context) (*pb.GetPendingTransactionsResponse, error) {
	return d.postgres.GetPendingTransactions(ctx)
}

func (d *DualStorage) GetTransactionsByWalletPaginated(ctx context.Context, walletAddress string, limit, offset int, sortOrder string, startTime, endTime int64) ([]common.Transaction, error) {
	// Use ClickHouse for wallet history (projection available)
	return d.clickhouse.GetTransactionsByWalletPaginated(ctx, walletAddress, limit, offset, sortOrder, startTime, endTime)
}

func (d *DualStorage) GetTransactionsByWalletCount(ctx context.Context, walletAddress string, startTime, endTime int64) (uint64, error) {
	// Count -> ClickHouse
	return d.clickhouse.GetTransactionsByWalletCount(ctx, walletAddress, startTime, endTime)
}

func (d *DualStorage) GetTotalTransactions(ctx context.Context) (uint64, error) {
	// Count -> ClickHouse
	return d.clickhouse.GetTotalTransactions(ctx)
}

func (d *DualStorage) GetTransactionsByWalletWithTimestamp(ctx context.Context, walletAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	return d.postgres.GetTransactionsByWalletWithTimestamp(ctx, walletAddress, limit, timestampLt, lastHash)
}

func (d *DualStorage) GetTransactionsByFromAddressWithTimestamp(ctx context.Context, fromAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	return d.postgres.GetTransactionsByFromAddressWithTimestamp(ctx, fromAddress, limit, timestampLt, lastHash)
}

func (d *DualStorage) GetTransactionsByToAddressWithTimestamp(ctx context.Context, toAddress string, limit int, timestampLt time.Time, lastHash string) ([]common.Transaction, error) {
	return d.postgres.GetTransactionsByToAddressWithTimestamp(ctx, toAddress, limit, timestampLt, lastHash)
}

func (d *DualStorage) RecalculateStats(ctx context.Context) error {
	var wg sync.WaitGroup
	var errPostgres, errClickHouse error

	wg.Add(2)

	go func() {
		defer wg.Done()
		errPostgres = d.postgres.RecalculateStats(ctx)
	}()

	go func() {
		defer wg.Done()
		errClickHouse = d.clickhouse.RecalculateStats(ctx)
	}()

	wg.Wait()

	if errPostgres != nil {
		return errPostgres
	}
	return errClickHouse
}

func (d *DualStorage) GetAllTransactionsByWallet(ctx context.Context, walletAddress string, startTime, endTime int64, sortBy, sortOrder string) ([]common.Transaction, error) {
	// Export -> ClickHouse (better for large datasets)
	return d.clickhouse.GetAllTransactionsByWallet(ctx, walletAddress, startTime, endTime, sortBy, sortOrder)
}
