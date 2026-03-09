package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	"dong-service/models"
	"dong-service/types"
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
				INSERT INTO %s.p2p_offers (
								intermediary_wallet_address, offer_creator_wallet_address, offer_creator_user_id, side, symbol, available_amount, total_amount, min_amount, max_amount, payable_amount, price_rate, status, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
		RETURNING offer_id, created_at, updated_at
	`, r.dongSchema)

	minToSave := types.NewBigIntString(1)
	maxToSave := offer.AvailableAmount
	if offer.Limit != nil {
		if offer.Limit.Min.Sign() > 0 {
			minToSave = offer.Limit.Min
		}
		if offer.Limit.Max.Sign() > 0 {
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
		offer.OfferCreatorWalletAddress,
		offer.OfferCreatorUserID,
		offer.Side,
		offer.Symbol,
		offer.AvailableAmount,
		offer.TotalAmount,
		minToSave,
		maxToSave,
		offer.PayableAmount,
		priceRateArg,
		offer.Status,
	).Scan(&offer.OfferID, &offer.CreatedAt, &offer.UpdatedAt)
}

func (r *OfferRepository) UpdateOfferStatus(
	ctx context.Context,
	offerID int64,
	status string,
	tx *sql.Tx,
	txHash *string,
) error {
	query := ""
	args := []any{}
	if txHash == nil {
		query = fmt.Sprintf(`
        UPDATE %s.p2p_offers
        SET status = $1, updated_at = NOW()
        WHERE offer_id = $2
    `, r.dongSchema)
		args = append(args, status, offerID)
	} else {
		query = fmt.Sprintf(`
        UPDATE %s.p2p_offers
        SET status = $1, transaction_hash = $2, updated_at = NOW()
        WHERE offer_id = $3
    `, r.dongSchema)
		args = append(args, status, *txHash, offerID)
	}

	_, err := tx.ExecContext(ctx, query, args...)
	return err
}

func (r *OfferRepository) ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, fromAmount *string, toAmount *string, side *string, pagination any) ([]models.Offer, error) {
	base := fmt.Sprintf(`SELECT o.offer_id, o.intermediary_wallet_address, o.offer_creator_wallet_address, o.offer_creator_user_id, o.side, o.symbol, o.available_amount, o.total_amount, o.min_amount, o.max_amount, o.payable_amount, o.price_rate, o.status, o.transaction_hash, o.created_at, o.updated_at,
		json_build_object('bank_name', p.bank_name, 'account_number', p.account_number, 'account_name', p.account_name, 'is_primary', p.is_primary) as bank_info
		FROM %s.p2p_offers o
		LEFT JOIN %s.user_payment_info p ON o.offer_creator_user_id = p.user_id AND p.is_primary = true`, r.dongSchema, r.dongSchema)

	whereClauses := []string{}
	args := []any{}
	argCount := 1

	if status != nil && strings.TrimSpace(*status) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argCount))
		args = append(args, strings.TrimSpace(*status))
		argCount++
	} else {
		whereClauses = append(whereClauses, "status = 'CONFIRMED'")
	}

	whereClauses = append(whereClauses, "available_amount > 0")

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
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount >= $%d AND available_amount <= $%d", argCount, argCount+1))
		args = append(args, strings.TrimSpace(*fromAmount), strings.TrimSpace(*toAmount))
		argCount += 2
	} else if fromAmount != nil && strings.TrimSpace(*fromAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount >= $%d", argCount))
		args = append(args, strings.TrimSpace(*fromAmount))
		argCount++
	} else if toAmount != nil && strings.TrimSpace(*toAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount <= $%d", argCount))
		args = append(args, strings.TrimSpace(*toAmount))
		argCount++
	}

	if side != nil && strings.TrimSpace(*side) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("side = $%d", argCount))
		args = append(args, strings.TrimSpace(*side))
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
			case "created_at", "payable_amount", "available_amount", "symbol", "price_rate":
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
		var minAmt sql.NullString
		var maxAmt sql.NullString
		var priceRate sql.NullFloat64
		var bankInfo sql.NullString
		err := rows.Scan(
			&o.OfferID,
			&o.IntermediaryWalletAddress,
			&o.OfferCreatorWalletAddress,
			&o.OfferCreatorUserID,
			&o.Side,
			&o.Symbol,
			&o.AvailableAmount,
			&o.TotalAmount,
			&minAmt,
			&maxAmt,
			&o.PayableAmount,
			&priceRate,
			&o.Status,
			&o.TransactionHash,
			&o.CreatedAt,
			&o.UpdatedAt,
			&bankInfo,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan offer: %w", err)
		}

		r.processOfferNullableFields(&o, minAmt, maxAmt, priceRate)

		if bankInfo.Valid {
			o.BankInfo = &bankInfo.String
		}
		out = append(out, o)
	}

	return out, rows.Err()
}

func (r *OfferRepository) CountOffers(ctx context.Context, walletAddress *string, minPrice *string, maxPrice *string, statuses []string, symbol *string, rate *string, fromAmount *string, toAmount *string, side *string) (int64, error) {
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s.p2p_offers`, r.dongSchema)
	whereClauses := []string{}
	args := []any{}
	argCount := 1

	// Apply status filter if provided
	if len(statuses) > 0 {
		placeholders := []string{}
		for _, status := range statuses {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argCount))
			args = append(args, status)
			argCount++
		}
		whereClauses = append(whereClauses, fmt.Sprintf("status IN (%s)", strings.Join(placeholders, ", ")))
		whereClauses = append(whereClauses, "available_amount > 0")
	}

	if walletAddress != nil && *walletAddress != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("offer_creator_wallet_address = $%d", argCount))
		args = append(args, *walletAddress)
		argCount++
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
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount >= $%d AND available_amount <= $%d", argCount, argCount+1))
		args = append(args, strings.TrimSpace(*fromAmount), strings.TrimSpace(*toAmount))
		argCount += 2
	} else if fromAmount != nil && strings.TrimSpace(*fromAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount >= $%d", argCount))
		args = append(args, strings.TrimSpace(*fromAmount))
		argCount++
	} else if toAmount != nil && strings.TrimSpace(*toAmount) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount <= $%d", argCount))
		args = append(args, strings.TrimSpace(*toAmount))
		argCount++
	}

	if side != nil && strings.TrimSpace(*side) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("side = $%d", argCount))
		args = append(args, strings.TrimSpace(*side))
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
func (r *OfferRepository) processOfferNullableFields(o *models.Offer, minAmt, maxAmt sql.NullString, priceRate sql.NullFloat64) {
	minVal := types.NewBigIntString(1)
	maxVal := o.AvailableAmount
	if minAmt.Valid {
		minVal = types.BigIntString{}
		minVal.SetString(minAmt.String, 10)
	}
	if maxAmt.Valid {
		maxVal = types.BigIntString{}
		maxVal.SetString(maxAmt.String, 10)
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
	var minAmt sql.NullString
	var maxAmt sql.NullString
	var priceRate sql.NullFloat64
	var bankInfo sql.NullString

	if err := row.Scan(
		&o.OfferID,
		&o.IntermediaryWalletAddress,
		&o.OfferCreatorWalletAddress,
		&o.OfferCreatorUserID,
		&o.Side,
		&o.Symbol,
		&o.AvailableAmount,
		&o.TotalAmount,
		&minAmt,
		&maxAmt,
		&o.PayableAmount,
		&priceRate,
		&o.Status,
		&o.TransactionHash,
		&o.CreatedAt,
		&o.UpdatedAt,
		&bankInfo,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, fmt.Errorf("failed to scan offer: %w", err)
	}

	r.processOfferNullableFields(&o, minAmt, maxAmt, priceRate)

	// Populate payment info if present
	if bankInfo.Valid {
		o.BankInfo = &bankInfo.String
	}

	return &o, nil
}

func (r *OfferRepository) GetOfferByID(ctx context.Context, offerID int64) (*models.Offer, error) {
	query := fmt.Sprintf(`
		SELECT o.offer_id, o.intermediary_wallet_address, o.offer_creator_wallet_address, o.offer_creator_user_id, o.side, o.symbol, 
		       o.available_amount, o.total_amount, o.min_amount, o.max_amount, o.payable_amount, o.price_rate, o.status, 
		       o.transaction_hash, o.created_at, o.updated_at,
		       json_build_object('bank_name', p.bank_name, 'account_number', p.account_number, 'account_name', p.account_name, 'is_primary', p.is_primary) as bank_info
		FROM %s.p2p_offers o
		LEFT JOIN %s.user_payment_info p ON o.offer_creator_user_id = p.user_id AND p.is_primary = true
		WHERE o.offer_id = $1
	`, r.dongSchema, r.dongSchema)

	row := r.db.QueryRowContext(ctx, query, offerID)
	return r.ScanOfferRow(row)
}

func (r *OfferRepository) GetOfferByIDForUpdate(ctx context.Context, offerID int64, tx *sql.Tx) (*models.Offer, error) {
	query := fmt.Sprintf(`
		SELECT o.offer_id, o.intermediary_wallet_address, o.offer_creator_wallet_address, o.offer_creator_user_id, o.side, o.symbol, 
		       o.available_amount, o.total_amount, o.min_amount, o.max_amount, o.payable_amount, o.price_rate, o.status, 
		       o.transaction_hash, o.created_at, o.updated_at,
		       json_build_object('bank_name', p.bank_name, 'account_number', p.account_number, 'account_name', p.account_name, 'is_primary', p.is_primary) as bank_info
		FROM %s.p2p_offers o
		LEFT JOIN %s.user_payment_info p ON o.offer_creator_user_id = p.user_id AND p.is_primary = true
		WHERE o.offer_id = $1
		FOR UPDATE OF o
	`, r.dongSchema, r.dongSchema)

	row := tx.QueryRowContext(ctx, query, offerID)
	return r.ScanOfferRow(row)
}

func (r *OfferRepository) ReserveQuantity(ctx context.Context, offerID int64, qty types.BigIntString, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.p2p_offers
		SET available_amount = available_amount - $1, updated_at = NOW()
		WHERE offer_id = $2 AND available_amount >= $1
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

func (r *OfferRepository) ReleaseQuantity(ctx context.Context, offerID int64, qty types.BigIntString, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.p2p_offers
		SET available_amount = available_amount + $1, updated_at = NOW()
		WHERE offer_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, qty, offerID)
	return err
}

func (r *OfferRepository) CheckAndCompleteIfEmpty(ctx context.Context, offerID int64, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.p2p_offers
		SET status = 'COMPLETED', updated_at = NOW()
		WHERE offer_id = $1 AND available_amount <= 0 AND status != 'COMPLETED'
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, offerID)
	return err
}

func (r *OfferRepository) GetOffersByWalletAddress(ctx context.Context, walletAddress string, side *string, pagination map[string]any, fromAmount *string, toAmount *string) ([]models.Offer, error) {
	whereClauses := []string{"offer_creator_wallet_address = $1"}
	args := []any{walletAddress}
	argCount := 2

	if fromAmount != nil && *fromAmount != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount >= $%d", argCount))
		args = append(args, *fromAmount)
		argCount++
	}

	if toAmount != nil && *toAmount != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("available_amount <= $%d", argCount))
		args = append(args, *toAmount)
		argCount++
	}

	if side != nil && *side != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("side = $%d", argCount))
		args = append(args, *side)
		argCount++
	}

	query := fmt.Sprintf(`
		SELECT o.offer_id, o.intermediary_wallet_address, o.offer_creator_wallet_address, o.offer_creator_user_id, o.side, o.symbol, o.available_amount, o.total_amount, 
		       o.min_amount, o.max_amount, o.payable_amount, o.price_rate, o.status, o.transaction_hash, o.created_at, o.updated_at,
		       json_build_object('bank_name', p.bank_name, 'account_number', p.account_number, 'account_name', p.account_name, 'is_primary', p.is_primary) as bank_info
		FROM %s.p2p_offers o
		LEFT JOIN %s.user_payment_info p ON o.offer_creator_user_id = p.user_id AND p.is_primary = true
		WHERE %s
		ORDER BY o.created_at DESC
	`, r.dongSchema, r.dongSchema, strings.Join(whereClauses, " AND "))

	if pagination != nil {
		if limit, ok := pagination["limit"].(int); ok && limit > 0 {
			query += fmt.Sprintf(" LIMIT %d", limit)
		}
		if offset, ok := pagination["offset"].(int); ok && offset > 0 {
			query += fmt.Sprintf(" OFFSET %d", offset)
		}
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var offers []models.Offer
	for rows.Next() {
		var o models.Offer
		var minAmount, maxAmount sql.NullString
		var priceRate sql.NullFloat64
		var bankInfo sql.NullString
		if err := rows.Scan(
			&o.OfferID,
			&o.IntermediaryWalletAddress,
			&o.OfferCreatorWalletAddress,
			&o.OfferCreatorUserID,
			&o.Side,
			&o.Symbol,
			&o.AvailableAmount,
			&o.TotalAmount,
			&minAmount,
			&maxAmount,
			&o.PayableAmount,
			&priceRate,
			&o.Status,
			&o.TransactionHash,
			&o.CreatedAt,
			&o.UpdatedAt,
			&bankInfo,
		); err != nil {
			return nil, err
		}

		r.processOfferNullableFields(&o, minAmount, maxAmount, priceRate)

		if bankInfo.Valid {
			o.BankInfo = &bankInfo.String
		}
		offers = append(offers, o)
	}

	return offers, rows.Err()
}

func (r *OfferRepository) ExistsByTxHash(ctx context.Context, txHash string) (bool, error) {
	query := fmt.Sprintf(`
        SELECT 1
        FROM %s.p2p_offers
        WHERE transaction_hash = $1
    `, r.dongSchema)

	var one int
	err := r.db.QueryRowContext(ctx, query, txHash).Scan(&one)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *OfferRepository) CountActiveOffersByUser(ctx context.Context, sellerUserID string) (int64, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.p2p_offers
		WHERE offer_creator_user_id = $1 AND status IN ('OPEN', 'PENDING', 'CONFIRMED')
	`, r.dongSchema)

	var count int64
	err := r.db.QueryRowContext(ctx, query, sellerUserID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count active offers by user: %w", err)
	}
	return count, nil
}
