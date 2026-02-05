package repository

import (
	"context"
	"database/sql"
	"fmt"
)

type BridgeSwapRepository struct {
	db            *sql.DB
	dongSchema    string
}

func NewBridgeSwapRepository(db *sql.DB, dongSchema string) *BridgeSwapRepository {
	return &BridgeSwapRepository{
		db:            db,
		dongSchema:    dongSchema,
	}
}

func (r *BridgeSwapRepository) GetLastProcessedBlock(ctx context.Context) (uint64, error) {
	var blockNumber uint64
	query := fmt.Sprintf(`
		SELECT block_number 
		FROM %s.bridge_checkpoint
		ORDER BY updated_at DESC
		LIMIT 1`, r.dongSchema)
	err := r.db.QueryRowContext(ctx, query).Scan(&blockNumber)
	if err != nil {
		return 0, err
	}
	return blockNumber, nil
}

func (r *BridgeSwapRepository) SaveLastProcessedBlock(ctx context.Context, blockNumber uint64) error {
	query := fmt.Sprintf(`
		INSERT INTO %s.bridge_checkpoint (block_number, updated_at)
		VALUES ($1, NOW())
		ON CONFLICT (id) DO UPDATE SET block_number = $1, updated_at = NOW()`, r.dongSchema)
	_, err := r.db.ExecContext(ctx, query, blockNumber)
	return err
}

func (r *BridgeSwapRepository) IsTransactionProcessed(ctx context.Context, txHash string) (bool, error) {
	var exists bool
	query := fmt.Sprintf(`
		SELECT EXISTS (
		SELECT 1 
		FROM %s.bridge_transactions
		WHERE tx_hash = $1)`, r.dongSchema)
	err := r.db.QueryRowContext(ctx, query, txHash).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (r *BridgeSwapRepository) MarkTranssactionProcessed(ctx context.Context, txHash, recipient, amount, memo string) error {
	query := fmt.Sprintf(`
		INSERT INTO %s.bridge_transactions (tx_hash, recipient, amount, memo, processed_at)
		VALUES ($1, $2, $3, $4, NOW())`, r.dongSchema)
	_, err := r.db.ExecContext(ctx, query, txHash, recipient, amount, memo)
	return err
}

func (r *BridgeSwapRepository) CreatePendingTransaction(ctx context.Context, txHash, recipient, amount, memo string) error {
	query := fmt.Sprintf(`
        INSERT INTO %s.bridge_transactions (tx_hash, recipient, amount, memo, status, processed_at)
        VALUES ($1, $2, $3, $4, 'PENDING', NOW())`, r.dongSchema)
	_, err := r.db.ExecContext(ctx, query, txHash, recipient, amount, memo)
	return err
}

func (r *BridgeSwapRepository) UpdateTransactionStatus(ctx context.Context, inTxHash, status, outTxHash, errorMsg string) error {
	query := fmt.Sprintf(`
        UPDATE %s.bridge_transactions 
        SET status = $1, out_tx_hash = $2, error_message = $3
        WHERE tx_hash = $4`, r.dongSchema)
	_, err := r.db.ExecContext(ctx, query, status, outTxHash, errorMsg, inTxHash)
	return err
}
