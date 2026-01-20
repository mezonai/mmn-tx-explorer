package repository

import (
	"context"
	"database/sql"
	"fmt"
	"dong-service/models"
)

type UserPaymentInfoRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewUserPaymentInfoRepository(db *sql.DB, dongSchema string) *UserPaymentInfoRepository {
	return &UserPaymentInfoRepository{db: db, dongSchema: dongSchema}
}

func (r *UserPaymentInfoRepository) UpsertPaymentInfo(ctx context.Context, info *models.UserPaymentInfo) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check if user has any records to determine if this should be primary
	var exists bool
	checkQuery := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM %s.user_payment_info WHERE user_id = $1)", r.dongSchema)
	err = tx.QueryRowContext(ctx, checkQuery, info.UserID).Scan(&exists)
	if err != nil {
		return err
	}

	if !exists {
		info.IsPrimary = true
	}

	if info.IsPrimary {
		// Reset all primary flags for user
		resetQuery := fmt.Sprintf("UPDATE %s.user_payment_info SET is_primary = false, updated_at = NOW() WHERE user_id = $1", r.dongSchema)
		if _, err := tx.ExecContext(ctx, resetQuery, info.UserID); err != nil {
			return err
		}
	}

	query := fmt.Sprintf(`
		INSERT INTO %s.user_payment_info (
			user_id, bank_name, account_number, account_name, is_primary, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (user_id, bank_name) DO UPDATE SET
			account_number = EXCLUDED.account_number,
			account_name = EXCLUDED.account_name,
			is_primary = EXCLUDED.is_primary,
			updated_at = NOW()
		RETURNING id, is_primary, created_at, updated_at
	`, r.dongSchema)

	err = tx.QueryRowContext(
		ctx,
		query,
		info.UserID,
		info.BankName,
		info.AccountNumber,
		info.AccountName,
		info.IsPrimary,
	).Scan(&info.ID, &info.IsPrimary, &info.CreatedAt, &info.UpdatedAt)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *UserPaymentInfoRepository) GetPrimaryByUserID(ctx context.Context, userID string) (*models.UserPaymentInfo, error) {
	query := fmt.Sprintf(`
		SELECT id, user_id, bank_name, account_number, account_name, is_primary, created_at, updated_at
		FROM %s.user_payment_info
		WHERE user_id = $1 AND is_primary = true
		LIMIT 1
	`, r.dongSchema)

	var info models.UserPaymentInfo
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&info.ID, &info.UserID, &info.BankName, &info.AccountNumber, &info.AccountName, &info.IsPrimary, &info.CreatedAt, &info.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		// Fallback to any record if no primary found
		fallbackQuery := fmt.Sprintf(`
			SELECT id, user_id, bank_name, account_number, account_name, is_primary, created_at, updated_at
			FROM %s.user_payment_info
			WHERE user_id = $1
			ORDER BY created_at ASC
			LIMIT 1
		`, r.dongSchema)
		err = r.db.QueryRowContext(ctx, fallbackQuery, userID).Scan(
			&info.ID, &info.UserID, &info.BankName, &info.AccountNumber, &info.AccountName, &info.IsPrimary, &info.CreatedAt, &info.UpdatedAt,
		)
		if err == sql.ErrNoRows {
			return nil, nil
		}
	}
	if err != nil {
		return nil, err
	}
	return &info, nil
}

func (r *UserPaymentInfoRepository) GetByUserID(ctx context.Context, userID string) ([]models.UserPaymentInfo, error) {
	query := fmt.Sprintf(`
		SELECT id, user_id, bank_name, account_number, account_name, is_primary, created_at, updated_at
		FROM %s.user_payment_info
		WHERE user_id = $1
		ORDER BY is_primary DESC, created_at DESC
	`, r.dongSchema)

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.UserPaymentInfo
	for rows.Next() {
		var info models.UserPaymentInfo
		err := rows.Scan(
			&info.ID, &info.UserID, &info.BankName, &info.AccountNumber, &info.AccountName, &info.IsPrimary, &info.CreatedAt, &info.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		results = append(results, info)
	}
	return results, rows.Err()
}

func (r *UserPaymentInfoRepository) DeletePaymentInfo(ctx context.Context, id int64, userID string) error {
	query := fmt.Sprintf("DELETE FROM %s.user_payment_info WHERE id = $1 AND user_id = $2", r.dongSchema)
	res, err := r.db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *UserPaymentInfoRepository) SetPrimary(ctx context.Context, id int64, userID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Reset all primary flags for user
	resetQuery := fmt.Sprintf("UPDATE %s.user_payment_info SET is_primary = false, updated_at = NOW() WHERE user_id = $1", r.dongSchema)
	if _, err := tx.ExecContext(ctx, resetQuery, userID); err != nil {
		return err
	}

	// Set new primary
	setQuery := fmt.Sprintf("UPDATE %s.user_payment_info SET is_primary = true, updated_at = NOW() WHERE id = $1 AND user_id = $2", r.dongSchema)
	if _, err := tx.ExecContext(ctx, setQuery, id, userID); err != nil {
		return err
	}

	return tx.Commit()
}
