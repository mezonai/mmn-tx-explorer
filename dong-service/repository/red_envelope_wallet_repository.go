package repository

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/utils"
	"fmt"

	"github.com/lib/pq"
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

	_, err := r.db.ExecContext(ctx, query, constants.RedEnvelopeWalletStatusDisabled, pq.Array(walletIDs))
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

func (r *RedEnvelopeWalletRepository) CreateWallets(ctx context.Context, wallets []*models.RedEnvelopeWallet) error {
	if len(wallets) == 0 {
		return nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	query := "INSERT INTO red_envelope_wallet (wallet_address, encrypted_private_key, status, created_at, updated_at) VALUES "
	vals := []interface{}{}

	for i, w := range wallets {
		n := i * 3
		query += fmt.Sprintf("($%d, $%d, $%d, NOW(), NOW()),", n+1, n+2, n+3)
		vals = append(vals, w.WalletAddress, w.EncryptedPrivateKey, w.Status)
	}

	query = query[0 : len(query)-1]
	query += " RETURNING id, created_at, updated_at"

	rows, err := tx.QueryContext(ctx, query, vals...)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer rows.Close()

	i := 0
	for rows.Next() {
		if err := rows.Scan(&wallets[i].ID, &wallets[i].CreatedAt, &wallets[i].UpdatedAt); err != nil {
			tx.Rollback()
			return err
		}
		i++
	}

	return tx.Commit()
}

func (r *RedEnvelopeWalletRepository) GetOrCreateAvailableWallet(ctx context.Context) (*models.RedEnvelopeWallet, error) {
	wallet, err := r.GetAvailableWallet(ctx)
	if err != nil && err.Error() != "no available wallets in the pool" {
		return nil, fmt.Errorf("failed to get available wallet: %w", err)
	}

	if wallet == nil {
		address, privateKey, err := r.generateWallet()
		if err != nil {
			return nil, fmt.Errorf("failed to generate wallet: %w", err)
		}

		encryptedKey, err := utils.EncryptPrivateKey(privateKey)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt private key: %w", err)
		}

		wallet = &models.RedEnvelopeWallet{
			WalletAddress:       address,
			EncryptedPrivateKey: encryptedKey,
			Status:              constants.RedEnvelopeWalletStatusInUse,
		}

		err = r.CreateWallet(ctx, wallet)
		if err != nil {
			return nil, fmt.Errorf("failed to save wallet: %w", err)
		}

		logger.Info().
			Str("address", address).
			Msg("Created new wallet on-demand")
	}

	return wallet, nil
}

func (r *RedEnvelopeWalletRepository) generateWallet() (address string, privateKey string, error error) {
	publicKey, privateKey, err := utils.GenerateEphemeralKeyPair()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to generate Ed25519 key pair")
		return "", "", fmt.Errorf("failed to generate key pair: %w", err)
	}

	logger.Info().
		Str("address", publicKey).
		Msg("Generated new wallet successfully")

	return publicKey, privateKey, nil
}

func (r *RedEnvelopeWalletRepository) GetAvailableWallet(ctx context.Context) (*models.RedEnvelopeWallet, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		SELECT id, wallet_address, encrypted_private_key, status, created_at, updated_at
		FROM red_envelope_wallet
		WHERE status = $1
		ORDER BY created_at ASC
		LIMIT 1
		FOR UPDATE SKIP LOCKED
	`

	var wallet models.RedEnvelopeWallet
	err = tx.QueryRowContext(ctx, query, constants.RedEnvelopeWalletStatusReady).Scan(
		&wallet.ID,
		&wallet.WalletAddress,
		&wallet.EncryptedPrivateKey,
		&wallet.Status,
		&wallet.CreatedAt,
		&wallet.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no available wallets in the pool")
		}
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	wallet.Status = constants.RedEnvelopeWalletStatusInUse

	return &wallet, nil
}

func (r *RedEnvelopeWalletRepository) GetWalletByAddress(ctx context.Context, address string) (*models.RedEnvelopeWallet, error) {
	query := `
		SELECT id, wallet_address, encrypted_private_key, status, created_at, updated_at
		FROM red_envelope_wallet
		WHERE wallet_address = $1
	`

	var wallet models.RedEnvelopeWallet
	err := r.db.QueryRowContext(ctx, query, address).Scan(
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

	return &wallet, nil
}

func (r *RedEnvelopeWalletRepository) UpdateRedEnvelopeInUse(tx *sql.Tx, ctx context.Context, walletID int64) error {
	updateQuery := `
		UPDATE red_envelope_wallet
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`

	_, err := tx.ExecContext(ctx, updateQuery, constants.RedEnvelopeWalletStatusInUse, walletID)
	if err != nil {
		return err
	}

	return nil
}

func (r *RedEnvelopeWalletRepository) UpdateWalletStatus(ctx context.Context, walletID int64, status string) error {
	query := `
		UPDATE red_envelope_wallet
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`
	_, err := r.db.ExecContext(ctx, query, status, walletID)
	return err
}

func (r *RedEnvelopeWalletRepository) ReleaseWallet(ctx context.Context, walletAddress string) error {
	query := `
		UPDATE red_envelope_wallet
		SET status = $1, updated_at = NOW()
		WHERE wallet_address = $2
	`
	_, err := r.db.ExecContext(ctx, query, constants.RedEnvelopeWalletStatusReady, walletAddress)
	return err
}
