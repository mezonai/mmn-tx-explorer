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

const (
	TYPE_HOT_WALLET_SWAP = "SWAP"
)

func NewHotWalletSwapRepository(db *sql.DB, dongSchema string) *HotWalletSwapRepository {
	return &HotWalletSwapRepository{db: db, dongSchema: dongSchema}
}

func (r *HotWalletSwapRepository) CreateWallet(ctx context.Context, wallet *models.HotWalletSwap) error {
	query := `
		INSERT INTO hot_wallet 
		(wallet_address, encrypted_private_key, type, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, created_at
	`
	err := r.db.QueryRowContext(ctx, query,
		wallet.WalletAddress,
		wallet.EncryptedPrivateKey,
		TYPE_HOT_WALLET_SWAP,
	).Scan(&wallet.ID, &wallet.CreatedAt)

	return err
}

func (r *HotWalletSwapRepository) GetHotWalletSwap(ctx context.Context) (*models.HotWalletSwap, error) {
	query := fmt.Sprintf(`
		SELECT wallet_address, encrypted_private_key
		FROM %s.hot_wallet
		WHERE type = $1
		ORDER BY created_at ASC
		LIMIT 1
	`, r.dongSchema)
	wallet := &models.HotWalletSwap{}
	err := r.db.QueryRowContext(ctx, query, TYPE_HOT_WALLET_SWAP).Scan(
		&wallet.WalletAddress,
		&wallet.EncryptedPrivateKey,
	)
	if err != nil {
		return nil, err
	}
	return wallet, nil
}

func (r *HotWalletSwapRepository) CreateSwapHistory(ctx context.Context, history *models.HotWalletHistory) error {
	query := fmt.Sprintf(`
        INSERT INTO %s.hot_wallet_history 
        (user_id, receive_wallet_address, send_wallet_address, tx_hash, amount, type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, created_at
    `, r.dongSchema)

	err := r.db.QueryRowContext(ctx, query,
		history.UserID,
		history.ReceiveWalletAddress,
		history.SendWalletAddress,
		history.TxHash,
		history.Amount,
		history.Type,
	).Scan(&history.ID, &history.CreatedAt)

	return err
}
