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

type IntermediaryWalletRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewIntermediaryWalletRepository(db *sql.DB, dongSchema string) *IntermediaryWalletRepository {
	return &IntermediaryWalletRepository{
		db:         db,
		dongSchema: dongSchema,
	}
}

func (r *IntermediaryWalletRepository) CreateWallet(ctx context.Context, wallet *models.IntermediaryWallet, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		INSERT INTO %s.intermediary_wallet 
		(wallet_address, encrypted_private_key, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`, r.dongSchema)

	return tx.QueryRowContext(
		ctx,
		query,
		wallet.WalletAddress,
		wallet.EncryptedPrivateKey,
		wallet.Status,
	).Scan(&wallet.ID, &wallet.CreatedAt, &wallet.UpdatedAt)
}

func (r *IntermediaryWalletRepository) FindOldWallets(ctx context.Context, daysOld int) ([]models.IntermediaryWallet, error) {
	query := fmt.Sprintf(`
		SELECT id, wallet_address, encrypted_private_key, status, created_at, updated_at
		FROM %s.intermediary_wallet
		WHERE status = ANY($1) AND created_at < NOW() - INTERVAL '1 day' * $2
		ORDER BY created_at ASC
	`, r.dongSchema)

	listStatus := []string{
		constants.RedEnvelopeWalletStatusReady,
		constants.RedEnvelopeWalletStatusPrepareReplace,
	}

	rows, err := r.db.QueryContext(ctx, query, pq.Array(listStatus), daysOld)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			logger.Error().Err(err).Msg("Rows close error")
		}
	}()

	var wallets []models.IntermediaryWallet
	for rows.Next() {
		var wallet models.IntermediaryWallet
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

func (r *IntermediaryWalletRepository) DisableWallets(ctx context.Context, walletIDs []int64) error {
	if len(walletIDs) == 0 {
		return nil
	}

	query := fmt.Sprintf(`
		UPDATE %s.intermediary_wallet
		SET status = $1, updated_at = NOW()
		WHERE id = ANY($2)
	`, r.dongSchema)

	_, err := r.db.ExecContext(ctx, query, constants.RedEnvelopeWalletStatusDisabled, pq.Array(walletIDs))
	return err
}

func (r *IntermediaryWalletRepository) GetPoolStatistics(ctx context.Context) (map[string]int, error) {
	query := fmt.Sprintf(`
		SELECT status, COUNT(*) as count
		FROM %s.intermediary_wallet
		GROUP BY status
	`, r.dongSchema)

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			logger.Error().Err(err).Msg("Rows close error")
		}
	}()

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

func (r *IntermediaryWalletRepository) CountAvailableWallets(ctx context.Context) (int, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.intermediary_wallet
		WHERE status = $1
	`, r.dongSchema)

	var count int
	err := r.db.QueryRowContext(ctx, query, constants.RedEnvelopeWalletStatusReady).Scan(&count)
	return count, err
}

func (r *IntermediaryWalletRepository) CreateWallets(ctx context.Context, wallets []*models.IntermediaryWallet) error {
	if len(wallets) == 0 {
		return nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	query := fmt.Sprintf("INSERT INTO %s.intermediary_wallet (wallet_address, encrypted_private_key, status, type, created_at, updated_at) VALUES ", r.dongSchema)
	vals := []interface{}{}

	for i, w := range wallets {
		n := i * 4
		query += fmt.Sprintf("($%d, $%d, $%d, $%d, NOW(), NOW()),", n+1, n+2, n+3, n+4)
		vals = append(vals, w.WalletAddress, w.EncryptedPrivateKey, w.Status, w.Type)
	}

	query = query[0 : len(query)-1]
	query += " RETURNING id, created_at, updated_at"

	rows, err := tx.QueryContext(ctx, query, vals...)
	if err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			logger.Error().Err(rollbackErr).Msg("Tx Rollback error")
		}
		return err
	}
	defer func() {
		if closeErr := rows.Close(); closeErr != nil {
			logger.Error().Err(closeErr).Msg("Rows close error")
		}
	}()

	i := 0
	for rows.Next() {
		if err := rows.Scan(&wallets[i].ID, &wallets[i].CreatedAt, &wallets[i].UpdatedAt); err != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				logger.Error().Err(rollbackErr).Msg("Tx Rollback error")
			}
			return err
		}
		i++
	}

	return tx.Commit()
}

func (r *IntermediaryWalletRepository) GetWalletByAddress(ctx context.Context, address string) (*models.IntermediaryWallet, error) {
	query := fmt.Sprintf(`
		SELECT id, wallet_address, encrypted_private_key, status, type, created_at, updated_at
		FROM %s.intermediary_wallet
		WHERE wallet_address = $1
	`, r.dongSchema)

	var wallet models.IntermediaryWallet
	err := r.db.QueryRowContext(ctx, query, address).Scan(
		&wallet.ID,
		&wallet.WalletAddress,
		&wallet.EncryptedPrivateKey,
		&wallet.Status,
		&wallet.Type,
		&wallet.CreatedAt,
		&wallet.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &wallet, nil
}

func (r *IntermediaryWalletRepository) UpdateIntermediaryWalletStatus(tx *sql.Tx, ctx context.Context, walletID int64, walletType string) error {
	updateQuery := fmt.Sprintf(`
		UPDATE %s.intermediary_wallet
		SET status = $1, updated_at = NOW(), type = $2
		WHERE id = $3
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, updateQuery, constants.RedEnvelopeWalletStatusInUse, walletType, walletID)
	if err != nil {
		return err
	}

	return nil
}

func (r *IntermediaryWalletRepository) GetOrCreateAvailableWallet(ctx context.Context, tx *sql.Tx, walletType string) (*models.IntermediaryWallet, error) {
	wallet, err := r.GetAvailableWallet(ctx, tx)
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

		wallet = &models.IntermediaryWallet{
			WalletAddress:       address,
			EncryptedPrivateKey: encryptedKey,
			Status:              constants.RedEnvelopeWalletStatusInUse,
			Type:                walletType,
		}

		err = r.CreateWallet(ctx, wallet, tx)
		if err != nil {
			return nil, fmt.Errorf("failed to save wallet: %w", err)
		}

		logger.Info().
			Str("address", address).
			Msg("Created new wallet on-demand")
	}

	return wallet, nil
}

func (r *IntermediaryWalletRepository) GetAvailableWallet(ctx context.Context, tx *sql.Tx) (*models.IntermediaryWallet, error) {
	query := fmt.Sprintf(`
		SELECT id, wallet_address, encrypted_private_key, status, type, created_at, updated_at
		FROM %s.intermediary_wallet
		WHERE status = $1
		ORDER BY created_at DESC
		LIMIT 1
		FOR UPDATE SKIP LOCKED
	`, r.dongSchema)

	var wallet models.IntermediaryWallet
	err := tx.QueryRowContext(ctx, query, constants.RedEnvelopeWalletStatusReady).Scan(
		&wallet.ID,
		&wallet.WalletAddress,
		&wallet.EncryptedPrivateKey,
		&wallet.Status,
		&wallet.Type,
		&wallet.CreatedAt,
		&wallet.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no available wallets in the pool")
		}
		return nil, err
	}

	wallet.Status = constants.RedEnvelopeWalletStatusInUse

	return &wallet, nil
}

func (r *IntermediaryWalletRepository) generateWallet() (address, privateKey string, err error) {
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

func (r *IntermediaryWalletRepository) UpdateWalletStatus(ctx context.Context, walletID int64, status string) error {
	query := fmt.Sprintf(`
		UPDATE %s.intermediary_wallet
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`, r.dongSchema)
	_, err := r.db.ExecContext(ctx, query, status, walletID)
	return err
}

func (r *IntermediaryWalletRepository) ReleaseWallet(ctx context.Context, walletAddress string) error {
	query := fmt.Sprintf(`
		UPDATE %s.intermediary_wallet
		SET status = $1, updated_at = NOW(), type = $2
		WHERE wallet_address = $3
	`, r.dongSchema)
	_, err := r.db.ExecContext(ctx, query, constants.RedEnvelopeWalletStatusReady, constants.WalletTypeDefault, walletAddress)
	return err
}
