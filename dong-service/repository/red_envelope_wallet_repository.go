package repository

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"dong-service/models"
)

type RedEnvelopeWalletRepository struct {
	db *sql.DB
}

func NewRedEnvelopeWalletRepository(db *sql.DB) *RedEnvelopeWalletRepository {
	return &RedEnvelopeWalletRepository{db: db}
}

func (r *RedEnvelopeWalletRepository) CreateWallet(ctx context.Context, wallet *models.RedEnvelopeWallet) error {
	query := `
		INSERT INTO red_envelope_wallet 
		(wallet_address, encrypted_private_key, status, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRowContext(
		ctx,
		query,
		wallet.WalletAddress,
		wallet.EncryptedPrivateKey,
		wallet.Status,
	).Scan(&wallet.ID, &wallet.CreatedAt, &wallet.UpdatedAt)
}

func (r *RedEnvelopeWalletRepository) FindOldReadyWallets(ctx context.Context, daysOld int) ([]models.RedEnvelopeWallet, error) {

	query := `
		SELECT id, wallet_address, encrypted_private_key, status, created_at, updated_at
		FROM red_envelope_wallet
		WHERE status = $1 AND created_at < NOW() - INTERVAL '1 day' * $2
		ORDER BY created_at ASC
	`

	rows, err := r.db.QueryContext(ctx, query, constants.RedEnvelopeWalletStatusReady, daysOld)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wallets []models.RedEnvelopeWallet
	for rows.Next() {
		var wallet models.RedEnvelopeWallet
		err := rows.Scan(
			&wallet.ID,
			&wallet.WalletAddress,
			&wallet.EncryptedPrivateKey,
			&wallet.Status,
			&wallet.CreatedAt,
			&wallet.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		wallets = append(wallets, wallet)
	}

	return wallets, rows.Err()
} 

func (r *RedEnvelopeWalletRepository) DisableWallets(ctx context.Context, walletIDs []int64) error {
	if len(walletIDs) == 0 {
		return nil
	}

	query := `
		UPDATE red_envelope_wallet
		SET status = $1, updated_at = NOW()
		WHERE id = ANY($2)
	`

	_, err := r.db.ExecContext(ctx, query, constants.RedEnvelopeWalletStatusDisabled, walletIDs)
	return err
}

func (r *RedEnvelopeWalletRepository) GetPoolStatistics(ctx context.Context) (map[string]int, error) {
	query := `
		SELECT status, COUNT(*) as count
		FROM red_envelope_wallet
		GROUP BY status
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		stats[status] = count
	}

	return stats, nil
}

func (r *RedEnvelopeWalletRepository) CountAvailableWallets(ctx context.Context) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM red_envelope_wallet
		WHERE status = $1
	`

	var count int
	err := r.db.QueryRowContext(ctx, query, constants.RedEnvelopeWalletStatusReady).Scan(&count)
	return count, err
}
