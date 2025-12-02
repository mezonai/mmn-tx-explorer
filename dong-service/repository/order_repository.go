package repository

import (
	"context"
	"database/sql"
	"dong-service/models"
	"fmt"
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
