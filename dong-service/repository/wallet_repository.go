package repository

import (
	"database/sql"
	"dong-service/models"
	"fmt"
	"time"
)

// WalletRepository handles database operations for wallets
type WalletRepository struct {
	db            *sql.DB
	indexerSchema string
}

// NewWalletRepository creates a new wallet repository
func NewWalletRepository(db *sql.DB, indexerSchema string) *WalletRepository {
	return &WalletRepository{
		db:            db,
		indexerSchema: indexerSchema,
	}
}

// GetByAddress retrieves wallet details by address
func (r *WalletRepository) GetByAddress(address string) (*models.Wallet, error) {
	query := fmt.Sprintf(`
		SELECT 
			address,
			COALESCE(account_nonce, 0) as account_nonce,
			COALESCE(balance::TEXT, '0') as balance,
			transaction_count,
			last_block,
			updated_at,
			created_at
		FROM %s.wallet
		WHERE address = $1
	`, r.indexerSchema)

	var wallet models.Wallet
	var updatedAt, createdAt time.Time

	err := r.db.QueryRow(query, address).Scan(
		&wallet.Address,
		&wallet.AccountNonce,
		&wallet.Balance,
		&wallet.TransactionCount,
		&wallet.LastBlock,
		&updatedAt,
		&createdAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("wallet not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get wallet: %w", err)
	}

	wallet.UpdatedAt = updatedAt
	wallet.CreatedAt = createdAt

	return &wallet, nil
}
