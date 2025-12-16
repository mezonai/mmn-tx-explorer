package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	"dong-service/models"
)

type OfferRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewOfferRepository(db *sql.DB, dongSchema string) *OfferRepository {
	return &OfferRepository{db: db, dongSchema: dongSchema}
}

func (r *OfferRepository) CreateOffer(ctx context.Context, offer *models.Offer, tx *sql.Tx) error {
	query := fmt.Sprintf(`
				INSERT INTO %s.offers (
								intermediary_wallet_address, seller_wallet_address, side, symbol, amount, total_amount, min_amount, max_amount, payable_amount, price_rate, status, bank_info, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
        RETURNING offer_id, created_at, updated_at
    `, r.dongSchema)

	minToSave := int64(1)
	maxToSave := offer.Amount
	if offer.Limit != nil {
		if offer.Limit.Min > 0 {
			minToSave = offer.Limit.Min
		}
		if offer.Limit.Max > 0 {
			maxToSave = offer.Limit.Max
		}
	}

	var priceRateArg any
	if offer.PriceRate != nil {
		priceRateArg = *offer.PriceRate
	}
	return tx.QueryRowContext(
		ctx,
		query,
		offer.IntermediaryWalletAddress,
		offer.SellerWalletAddress,
		offer.Side,
		offer.Symbol,
		offer.Amount,
		offer.TotalAmount,
		minToSave,
		maxToSave,
		offer.PayableAmount,
		priceRateArg,
		offer.Status,
		offer.BankInfo,
	).Scan(&offer.OfferID, &offer.CreatedAt, &offer.UpdatedAt)
}

func (r *OfferRepository) UpdateOfferStatus(
	ctx context.Context,
	offerID int64,
	status string,
	tx *sql.Tx,
	txHash *string,
) error {

	query := fmt.Sprintf(`
        UPDATE %s.offers
        SET status = $1, transaction_hash = $2, updated_at = NOW()
        WHERE offer_id = $3
    `, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, status, *txHash, offerID)
	return err
}

func (r *OfferRepository) ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, fromAmount *string, toAmount *string, pagination any) ([]models.Offer, error) {
	base := fmt.Sprintf(`SELECT offer_id, intermediary_wallet_address, seller_wallet_address, side, symbol, amount, total_amount, min_amount, max_amount, payable_amount, price_rate, status, bank_info, created_at, updated_at FROM %s.offers`, r.dongSchema)

	whereClauses := []string{}
	args := []any{}
	argCount := 1

	if status != nil && strings.TrimSpace(*status) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argCount))
		args = append(args, strings.TrimSpace(*status))
		argCount++
	} else {
		whereClauses = append(whereClauses, "status NOT IN ('CANCELED', 'FAILED', 'COMPLETED')")
	}

	if minPrice != nil && *minPrice != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("payable_amount >= $%d", argCount))
		args = append(args, *minPrice)
		argCount++
	}
	if maxPrice != nil && *maxPrice != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("payable_amount <= $%d", argCount))
		args = append(args, *maxPrice)
		argCount++
	}
	if symbol != nil && strings.TrimSpace(*symbol) != "" {
		sym := strings.TrimSpace(*symbol)
		vals := []string{sym}

		if len(vals) == 1 {
			whereClauses = append(whereClauses, fmt.Sprintf("LOWER(symbol) = LOWER($%d)", argCount))
			args = append(args, vals[0])
			argCount++
		} else {
			parts := []string{}
			for i := range vals {
				parts = append(parts, fmt.Sprintf("LOWER(symbol) = LOWER($%d)", argCount))
				args = append(args, vals[i])
				argCount++
			}
			whereClauses = append(whereClauses, "("+strings.Join(parts, " OR ")+")")
		}
	}
	if rate != nil && strings.TrimSpace(*rate) != "" {
		if rv, parseErr := strconv.ParseFloat(strings.TrimSpace(*rate), 64); parseErr == nil {
			whereClauses = append(whereClauses, fmt.Sprintf("price_rate >= $%d", argCount))
			args = append(args, rv)
			argCount++
		}
	}

	if fromAmount != nil && strings.TrimSpace(*fromAmount) != "" && toAmount != nil && strings.TrimSpace(*toAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("amount >= $%d AND amount <= $%d", argCount, argCount+1))
		args = append(args, strings.TrimSpace(*fromAmount), strings.TrimSpace(*toAmount))
		argCount += 2
	} else if fromAmount != nil && strings.TrimSpace(*fromAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("amount >= $%d", argCount))
		args = append(args, strings.TrimSpace(*fromAmount))
		argCount++
	} else if toAmount != nil && strings.TrimSpace(*toAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("amount <= $%d", argCount))
		args = append(args, strings.TrimSpace(*toAmount))
		argCount++
	}

	if len(whereClauses) > 0 {
		base += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	orderBy := "created_at"
	orderDir := "DESC"
	limit := 20
	offset := 0

	if p, ok := pagination.(map[string]any); ok {
		if v, ok := p["order_by"].(string); ok && v != "" {
			switch strings.ToLower(v) {
			case "created_at", "payable_amount", "amount", "symbol":
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
		var minAmt sql.NullInt64
		var maxAmt sql.NullInt64
		var priceRate sql.NullFloat64
		err := rows.Scan(
			&o.OfferID,
			&o.IntermediaryWalletAddress,
			&o.SellerWalletAddress,
			&o.Side,
			&o.Symbol,
			&o.Amount,
			&o.TotalAmount,
			&minAmt,
			&maxAmt,
			&o.PayableAmount,
			&priceRate,
			&o.Status,
			&o.BankInfo,
			&o.CreatedAt,
			&o.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan offer: %w", err)
		}

		r.processOfferNullableFields(&o, minAmt, maxAmt, priceRate)
		out = append(out, o)
	}

	return out, rows.Err()
}

func (r *OfferRepository) CountOffers(ctx context.Context, walletAddress *string, fromAmount *string, toAmount *string) (int64, error) {
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s.offers`, r.dongSchema)
	whereClauses := []string{}
	args := []any{}
	argCount := 1

	if walletAddress != nil && *walletAddress != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("seller_wallet_address = $%d", argCount))
		args = append(args, *walletAddress)
		argCount++
	}

	if fromAmount != nil && strings.TrimSpace(*fromAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("amount >= $%d", argCount))
		args = append(args, strings.TrimSpace(*fromAmount))
		argCount++
	}
	if toAmount != nil && strings.TrimSpace(*toAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("amount <= $%d", argCount))
		args = append(args, strings.TrimSpace(*toAmount))
		argCount++
	}

	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int64
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to count offers: %w", err)
	}

	return total, nil
}

// processOfferNullableFields handles nullable fields and sets defaults for an offer
func (r *OfferRepository) processOfferNullableFields(o *models.Offer, minAmt, maxAmt sql.NullInt64, priceRate sql.NullFloat64) {
	minVal := int64(1)
	maxVal := o.Amount
	if minAmt.Valid {
		minVal = minAmt.Int64
	}
	if maxAmt.Valid {
		maxVal = maxAmt.Int64
	}
	if priceRate.Valid {
		v := priceRate.Float64
		o.PriceRate = &v
	} else {
		o.PriceRate = nil
	}
	o.Limit = &models.OfferLimit{Min: minVal, Max: maxVal}
}

func (r *OfferRepository) ScanOfferRow(row *sql.Row) (*models.Offer, error) {
	var o models.Offer
	var minAmt sql.NullInt64
	var maxAmt sql.NullInt64
	var priceRate sql.NullFloat64

	if err := row.Scan(
		&o.OfferID,
		&o.IntermediaryWalletAddress,
		&o.SellerWalletAddress,
		&o.Side,
		&o.Symbol,
		&o.Amount,
		&o.TotalAmount,
		&minAmt,
		&maxAmt,
		&o.PayableAmount,
		&priceRate,
		&o.Status,
		&o.BankInfo,
		&o.CreatedAt,
		&o.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, fmt.Errorf("failed to scan offer: %w", err)
	}

	r.processOfferNullableFields(&o, minAmt, maxAmt, priceRate)
	return &o, nil
}

func (r *OfferRepository) GetOfferByID(ctx context.Context, offerID int64) (*models.Offer, error) {
	query := fmt.Sprintf(`
		SELECT offer_id, intermediary_wallet_address, seller_wallet_address, side, symbol, 
		       amount, total_amount, min_amount, max_amount, payable_amount, price_rate, status, 
		       bank_info, created_at, updated_at 
		FROM %s.offers 
		WHERE offer_id = $1
	`, r.dongSchema)

	row := r.db.QueryRowContext(ctx, query, offerID)
	return r.ScanOfferRow(row)
}

func (r *OfferRepository) GetOfferByIDForUpdate(ctx context.Context, offerID int64, tx *sql.Tx) (*models.Offer, error) {
	query := fmt.Sprintf(`
		SELECT offer_id, intermediary_wallet_address, seller_wallet_address, side, symbol, 
		       amount, total_amount, min_amount, max_amount, payable_amount, price_rate, status, 
		       bank_info, created_at, updated_at
		FROM %s.offers
		WHERE offer_id = $1
		FOR UPDATE
	`, r.dongSchema)

	row := tx.QueryRowContext(ctx, query, offerID)
	return r.ScanOfferRow(row)
}

func (r *OfferRepository) ReserveQuantity(ctx context.Context, offerID int64, qty int64, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.offers
		SET amount = amount - $1, updated_at = NOW()
		WHERE offer_id = $2 AND amount >= $1
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

func (r *OfferRepository) ReleaseQuantity(ctx context.Context, offerID int64, qty int64, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.offers
		SET amount = amount + $1, updated_at = NOW()
		WHERE offer_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, qty, offerID)
	return err
}

func (r *OfferRepository) ApplyConfirmedQuantity(ctx context.Context, offerID int64, qty int64, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.offers
		SET total_amount = total_amount - $1, updated_at = NOW(), status = CASE WHEN total_amount - $1 <= 0 THEN 'COMPLETED' ELSE status END
		WHERE offer_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, qty, offerID)
	return err
}

func (r *OfferRepository) GetOffersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Offer, error) {
	query := fmt.Sprintf(`
		SELECT offer_id, intermediary_wallet_address, seller_wallet_address, side, symbol, amount, total_amount, 
		       min_amount, max_amount, payable_amount, price_rate, status, bank_info, created_at, updated_at
		FROM %s.offers
		WHERE seller_wallet_address = $1
		ORDER BY created_at DESC
	`, r.dongSchema)

	if pagination != nil {
		if limit, ok := pagination["limit"].(int); ok && limit > 0 {
			query += fmt.Sprintf(" LIMIT %d", limit)
		}
		if offset, ok := pagination["offset"].(int); ok && offset > 0 {
			query += fmt.Sprintf(" OFFSET %d", offset)
		}
	}

	rows, err := r.db.QueryContext(ctx, query, walletAddress)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var offers []models.Offer
	for rows.Next() {
		var o models.Offer
		var minAmount, maxAmount sql.NullInt64
		var priceRate sql.NullFloat64
		if err := rows.Scan(
			&o.OfferID,
			&o.IntermediaryWalletAddress,
			&o.SellerWalletAddress,
			&o.Side,
			&o.Symbol,
			&o.Amount,
			&o.TotalAmount,
			&minAmount,
			&maxAmount,
			&o.PayableAmount,
			&priceRate,
			&o.Status,
			&o.BankInfo,
			&o.CreatedAt,
			&o.UpdatedAt,
		); err != nil {
			return nil, err
		}

		r.processOfferNullableFields(&o, minAmount, maxAmount, priceRate)
		offers = append(offers, o)
	}

	return offers, rows.Err()
}
