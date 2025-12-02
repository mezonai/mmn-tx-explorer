package repository

import (
	"context"
	"database/sql"
	"dong-service/models"
	"fmt"
	"strings"
)

type OrderRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewOrderRepository(db *sql.DB, dongSchema string) *OrderRepository {
	return &OrderRepository{db: db, dongSchema: dongSchema}
}

// CreateOrder inserts a new order into orders table using the provided tx.
func (r *OrderRepository) CreateOrder(ctx context.Context, order *models.Order, tx *sql.Tx) error {
	query := fmt.Sprintf(`
        INSERT INTO %s.orders (
            intermediary_wallet_id, user_id, side, symbol, quantity, price, filled_quantity, price_type, price_reference, spread, status, external_ref, metadata, expires_at, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
        RETURNING order_id, created_at, updated_at
    `, r.dongSchema)

	return tx.QueryRowContext(
		ctx,
		query,
		order.IntermediaryWalletID,
		order.UserID,
		order.Side,
		order.Symbol,
		order.Quantity,
		order.Price,
		order.FilledQuantity,
		order.PriceType,
		order.PriceReference,
		order.Spread,
		order.Status,
		order.ExternalRef,
		order.Metadata,
		order.ExpiresAt,
	).Scan(&order.OrderID, &order.CreatedAt, &order.UpdatedAt)
}

// CreateOrderHistory inserts a new audit/event row for an order using the provided tx.
func (r *OrderRepository) CreateOrderHistory(ctx context.Context, h *models.OrderHistory, tx *sql.Tx) error {
	query := fmt.Sprintf(`
        INSERT INTO %s.order_history (
            order_id, event_type, quantity, execution_price, source, metadata, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
        RETURNING history_id, created_at
    `, r.dongSchema)

	return tx.QueryRowContext(ctx, query, h.OrderID, h.EventType, h.Quantity, h.ExecutionPrice, h.Source, h.Metadata).Scan(&h.HistoryID, &h.CreatedAt)
}

// UpdateOrderStatus updates the status field for a given order using the provided tx.
func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID int64, status string, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.orders
		SET status = $1, updated_at = NOW()
		WHERE order_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, status, orderID)
	return err
}

// ListOrders returns orders matching optional filters with pagination
func (r *OrderRepository) ListOrders(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, pagination any) ([]models.Order, error) {
	// Accept pagination as a struct but avoid importing utils here to keep repository generic; caller will build SQL values
	// We'll accept pagination as a map-like struct by type assertion in caller — keep signature flexible for now
	// Build base query
	base := fmt.Sprintf(`SELECT order_id, intermediary_wallet_id, user_id, side, symbol, quantity, price, filled_quantity, price_type, price_reference, spread, status, external_ref, metadata, expires_at, created_at, updated_at FROM %s.orders`, r.dongSchema)

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

	if len(whereClauses) > 0 {
		base += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Default ordering
	orderBy := "created_at"
	orderDir := "DESC"
	limit := 20
	offset := 0

	// If pagination is utils.PaginationParams, extract values
	if p, ok := pagination.(map[string]any); ok {
		if v, ok := p["order_by"].(string); ok && v != "" {
			// whitelist
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
		return nil, fmt.Errorf("failed to list orders: %w", err)
	}
	defer rows.Close()

	var out []models.Order
	for rows.Next() {
		var o models.Order
		err := rows.Scan(
			&o.OrderID,
			&o.IntermediaryWalletID,
			&o.UserID,
			&o.Side,
			&o.Symbol,
			&o.Quantity,
			&o.Price,
			&o.FilledQuantity,
			&o.PriceType,
			&o.PriceReference,
			&o.Spread,
			&o.Status,
			&o.ExternalRef,
			&o.Metadata,
			&o.ExpiresAt,
			&o.CreatedAt,
			&o.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		out = append(out, o)
	}

	return out, rows.Err()
}

// GetOrderByID fetches a single order by id
func (r *OrderRepository) GetOrderByID(ctx context.Context, orderID int64) (*models.Order, error) {
	query := fmt.Sprintf(`SELECT order_id, intermediary_wallet_id, user_id, side, symbol, quantity, price, filled_quantity, price_type, price_reference, spread, status, external_ref, metadata, expires_at, created_at, updated_at FROM %s.orders WHERE order_id = $1`, r.dongSchema)

	var o models.Order
	row := r.db.QueryRowContext(ctx, query, orderID)
	if err := row.Scan(
		&o.OrderID,
		&o.IntermediaryWalletID,
		&o.UserID,
		&o.Side,
		&o.Symbol,
		&o.Quantity,
		&o.Price,
		&o.FilledQuantity,
		&o.PriceType,
		&o.PriceReference,
		&o.Spread,
		&o.Status,
		&o.ExternalRef,
		&o.Metadata,
		&o.ExpiresAt,
		&o.CreatedAt,
		&o.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, fmt.Errorf("failed to scan order: %w", err)
	}

	return &o, nil
}
