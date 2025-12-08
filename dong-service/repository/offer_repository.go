package repository

import (
	"context"
	"database/sql"
	"dong-service/models"
	"fmt"
	"strings"
)

type OfferRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewOfferRepository(db *sql.DB, dongSchema string) *OfferRepository {
	return &OfferRepository{db: db, dongSchema: dongSchema}
}

// CreateOffer inserts a new offer into offers table using the provided tx.
func (r *OfferRepository) CreateOffer(ctx context.Context, offer *models.Offer, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		INSERT INTO %s.offers (
			intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, price, price_type, status, metadata, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
        RETURNING offer_id, created_at, updated_at
    `, r.dongSchema)

	return tx.QueryRowContext(
		ctx,
		query,
		offer.IntermediaryWalletID,
		offer.WalletAddress,
		offer.Side,
		offer.Symbol,
		offer.Quantity,
		offer.TotalQuantity,
		offer.Price,
		offer.PriceType,
		offer.Status,
		offer.Metadata,
	).Scan(&offer.OfferID, &offer.CreatedAt, &offer.UpdatedAt)
}

// NOTE: Offer history functionality has been removed; history rows are no longer written here.

// UpdateOfferStatus updates the status field for a given offer using the provided tx.
func (r *OfferRepository) UpdateOfferStatus(ctx context.Context, offerID int64, status string, tx *sql.Tx, txHash *string) error {
	var query string
	if txHash != nil {
		query = fmt.Sprintf(`
		UPDATE %s.offers
		SET status = $1, transaction_hash = $2, updated_at = NOW()
		WHERE offer_id = $3
	`, r.dongSchema)
		_, err := tx.ExecContext(ctx, query, status, *txHash, offerID)
		return err
	}

	query = fmt.Sprintf(`
		UPDATE %s.offers
		SET status = $1, updated_at = NOW()
		WHERE offer_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, status, offerID)
	return err
}

// ListOffers returns offers matching optional filters with pagination
func (r *OfferRepository) ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, pagination any) ([]models.Offer, error) {
	base := fmt.Sprintf(`SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, price, price_rate, price_type, status, metadata, created_at, updated_at FROM %s.offers`, r.dongSchema)

	whereClauses := []string{}
	args := []any{}
	argCount := 1

	if minPrice != nil && *minPrice != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("price >= $%d", argCount))
		args = append(args, *minPrice)
		argCount++
	}
	if maxPrice != nil && *maxPrice != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("price <= $%d", argCount))
		args = append(args, *maxPrice)
		argCount++
	}
	if status != nil && strings.TrimSpace(*status) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argCount))
		args = append(args, strings.TrimSpace(*status))
		argCount++
	}
	if symbol != nil && strings.TrimSpace(*symbol) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("symbol = $%d", argCount))
		args = append(args, strings.TrimSpace(*symbol))
		argCount++
	}
	if rate != nil && strings.TrimSpace(*rate) != "" {
		// filter by minimum price_rate
		whereClauses = append(whereClauses, fmt.Sprintf("price_rate >= $%d", argCount))
		args = append(args, strings.TrimSpace(*rate))
		argCount++
	}

	if len(whereClauses) > 0 {
		base += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Default ordering
	orderBy := "created_at"
	orderDir := "DESC"
	limit := 20
	offset := 0

	if p, ok := pagination.(map[string]any); ok {
		if v, ok := p["order_by"].(string); ok && v != "" {
			switch strings.ToLower(v) {
			case "created_at", "price", "quantity", "symbol":
				orderBy = v
			}
		}
		if od, ok := p["order"].(string); ok && (strings.EqualFold(od, "asc") || strings.EqualFold(od, "desc")) {
			orderDir = strings.ToUpper(od)
		}
		if l, ok := p["limit"].(int); ok && l > 0 {
			limit = l
		}
		if off, ok := p["offset"].(int); ok && off >= 0 {
			offset = off
		}
	}

	base += fmt.Sprintf(" ORDER BY %s %s LIMIT $%d OFFSET $%d", orderBy, orderDir, argCount, argCount+1)
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, base, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list offers: %w", err)
	}
	defer rows.Close()

	var out []models.Offer
	for rows.Next() {
		var o models.Offer
		err := rows.Scan(
			&o.OfferID,
			&o.IntermediaryWalletID,
			&o.WalletAddress,
			&o.Side,
			&o.Symbol,
			&o.Quantity,
			&o.TotalQuantity,
			&o.Price,
			&o.PriceRate,
			&o.PriceType,
			&o.Status,
			&o.Metadata,
			&o.CreatedAt,
			&o.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan offer: %w", err)
		}
		out = append(out, o)
	}

	return out, rows.Err()
}

// CountOffers returns the total number of offers matching optional filters
func (r *OfferRepository) CountOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string) (int64, error) {
	base := fmt.Sprintf(`SELECT COUNT(*) FROM %s.offers`, r.dongSchema)

	whereClauses := []string{}
	args := []any{}
	argCount := 1

	if minPrice != nil && *minPrice != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("price >= $%d", argCount))
		args = append(args, *minPrice)
		argCount++
	}
	if maxPrice != nil && *maxPrice != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("price <= $%d", argCount))
		args = append(args, *maxPrice)
		argCount++
	}
	if status != nil && strings.TrimSpace(*status) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argCount))
		args = append(args, strings.TrimSpace(*status))
		argCount++
	}
	if symbol != nil && strings.TrimSpace(*symbol) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("symbol = $%d", argCount))
		args = append(args, strings.TrimSpace(*symbol))
		argCount++
	}
	if rate != nil && strings.TrimSpace(*rate) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("price_rate >= $%d", argCount))
		args = append(args, strings.TrimSpace(*rate))
		argCount++
	}

	if len(whereClauses) > 0 {
		base += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int64
	err := r.db.QueryRowContext(ctx, base, args...).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to count offers: %w", err)
	}

	return total, nil
}

func (r *OfferRepository) GetOfferByID(ctx context.Context, offerID int64) (*models.Offer, error) {
	query := fmt.Sprintf(`SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, price, price_rate, price_type, status, metadata, created_at, updated_at FROM %s.offers WHERE offer_id = $1`, r.dongSchema)

	var o models.Offer
	row := r.db.QueryRowContext(ctx, query, offerID)
	if err := row.Scan(
		&o.OfferID,
		&o.IntermediaryWalletID,
		&o.WalletAddress,
		&o.Side,
		&o.Symbol,
		&o.Quantity,
		&o.TotalQuantity,
		&o.Price,
		&o.PriceRate,
		&o.PriceType,
		&o.Status,
		&o.Metadata,
		&o.CreatedAt,
		&o.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, fmt.Errorf("failed to scan offer: %w", err)
	}

	return &o, nil
}

// ReserveQuantity reduces the available quantity for an offer (used to block amount when creating an order)
func (r *OfferRepository) ReserveQuantity(ctx context.Context, offerID int64, qty int64, tx *sql.Tx) error {
	// ensure enough available quantity and atomically decrement
	query := fmt.Sprintf(`
		UPDATE %s.offers
		SET quantity = quantity - $1, updated_at = NOW()
		WHERE offer_id = $2 AND quantity >= $1
	`, r.dongSchema)

	res, err := tx.ExecContext(ctx, query, qty, offerID)
	if err != nil {
		return err
	}
	cnt, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if cnt == 0 {
		return fmt.Errorf("insufficient offer quantity or offer not found")
	}
	return nil
}

// ReleaseQuantity returns previously reserved quantity back to an offer (e.g., when order cancelled)
func (r *OfferRepository) ReleaseQuantity(ctx context.Context, offerID int64, qty int64, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.offers
		SET quantity = quantity + $1, updated_at = NOW()
		WHERE offer_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, qty, offerID)
	return err
}

// ApplyConfirmedQuantity marks consumed amount at confirmation (reduce total_quantity and potentially complete the offer)
func (r *OfferRepository) ApplyConfirmedQuantity(ctx context.Context, offerID int64, qty int64, tx *sql.Tx) error {
	// reduce total_quantity and mark completed if remaining <= 0
	query := fmt.Sprintf(`
		UPDATE %s.offers
		SET total_quantity = total_quantity - $1, updated_at = NOW(), status = CASE WHEN total_quantity - $1 <= 0 THEN 'COMPLETED' ELSE status END
		WHERE offer_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, qty, offerID)
	return err
}
