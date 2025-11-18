package repository

import (
	"context"
	"database/sql"
	"dong-service/models"
	"fmt"
)

type HotWalletSwapRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewHotWalletSwapRepository(db *sql.DB, dongSchema string) *HotWalletSwapRepository {
	return &HotWalletSwapRepository{db: db, dongSchema: dongSchema}
}

func (r *HotWalletSwapRepository) CreateWallet(ctx context.Context, wallet *models.HotWalletSwap) error {
	query := `
		INSERT INTO hot_wallet_swap 
		(wallet_address, encrypted_private_key, created_at)
		VALUES ($1, $2, NOW())
		RETURNING id, created_at
	`
	err := r.db.QueryRowContext(ctx, query,
		wallet.WalletAddress,
		wallet.EncryptedPrivateKey,
	).Scan(&wallet.ID, &wallet.CreatedAt)

	return err
}

func (r *HotWalletSwapRepository) GetHotWalletSwap(ctx context.Context) (*models.HotWalletSwap, error) {
	query := fmt.Sprintf(`
		SELECT wallet_address, encrypted_private_key
		FROM %s.hot_wallet_swap
		ORDER BY created_at ASC
		LIMIT 1
	`, r.dongSchema)
	wallet := &models.HotWalletSwap{}
	err := r.db.QueryRowContext(ctx, query).Scan(
		&wallet.WalletAddress,
		&wallet.EncryptedPrivateKey,
	)
	if err != nil {
		return nil, err
	}
	return wallet, nil
}
