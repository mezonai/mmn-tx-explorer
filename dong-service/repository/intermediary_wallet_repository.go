package repository

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"fmt"

	"github.com/lib/pq"
)

type IntermediaryWalletRepository struct {
	db *sql.DB
}

func NewIntermediaryWalletRepository(db *sql.DB) *IntermediaryWalletRepository {
	return &IntermediaryWalletRepository{db: db}
}

func (r *IntermediaryWalletRepository) CreateWallet(ctx context.Context, wallet *models.IntermediaryWallet) error {
	query := `
		INSERT INTO intermediary_wallet 
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

func (r *IntermediaryWalletRepository) FindOldReadyWallets(ctx context.Context, daysOld int) ([]models.IntermediaryWallet, error) {
	query := `
		SELECT id, wallet_address, encrypted_private_key, status, created_at, updated_at
		FROM intermediary_wallet
		WHERE status = $1 AND created_at < NOW() - INTERVAL '1 day' * $2
		ORDER BY created_at ASC
	`

	rows, err := r.db.QueryContext(ctx, query, constants.RedEnvelopeWalletStatusReady, daysOld)
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

	query := `
		UPDATE intermediary_wallet
		SET status = $1, updated_at = NOW()
		WHERE id = ANY($2)
	`

	_, err := r.db.ExecContext(ctx, query, constants.RedEnvelopeWalletStatusDisabled, pq.Array(walletIDs))
	return err
}

func (r *IntermediaryWalletRepository) GetPoolStatistics(ctx context.Context) (map[string]int, error) {
	query := `
		SELECT status, COUNT(*) as count
		FROM intermediary_wallet
		GROUP BY status
	`

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
	query := `
		SELECT COUNT(*)
		FROM intermediary_wallet
		WHERE status = $1
	`

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

	query := "INSERT INTO intermediary_wallet (wallet_address, encrypted_private_key, status, created_at, updated_at) VALUES "
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
		if err = tx.Rollback(); err != nil {
			logger.Error().Err(err).Msg("Tx Rollback error error")
		}
		return err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			logger.Error().Err(err).Msg("Rows close error")
		}
	}()

	i := 0
	for rows.Next() {
		if err := rows.Scan(&wallets[i].ID, &wallets[i].CreatedAt, &wallets[i].UpdatedAt); err != nil {
			if err = tx.Rollback(); err != nil {
				logger.Error().Err(err).Msg("Tx Rollback error error")
			}
			return err
		}
		i++
	}

	return tx.Commit()
}
