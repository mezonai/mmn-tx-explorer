package repository

import (
	"context"
	"database/sql"
	"dong-service/models"
	"fmt"
	"strings"
	"time"
)

type OrderRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewOrderRepository(db *sql.DB, dongSchema string) *OrderRepository {
	return &OrderRepository{db: db, dongSchema: dongSchema}
}

func (r *OrderRepository) CreateOrder(ctx context.Context, order *models.Order, tx *sql.Tx) error {
	query := fmt.Sprintf(`
			    INSERT INTO %s.orders (
						offer_id, wallet_address, quantity, amount, price, status, transfer_code, expires_at, created_at, updated_at
					) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
        RETURNING order_id, created_at, updated_at
    `, r.dongSchema)

	return tx.QueryRowContext(ctx, query,
		order.OfferID,
		order.BuyerWalletAddress,
		order.Amount,
		order.Price,
		order.Status,
		order.TransferCode,
		order.ExpiresAt,
	).Scan(&order.OrderID, &order.CreatedAt, &order.UpdatedAt)
}

func (r *OrderRepository) HasActiveOrders(ctx context.Context, offerID int64) (bool, error) {
	query := fmt.Sprintf("SELECT COUNT(1) FROM %s.orders WHERE offer_id = $1 AND status IN ('PENDING','CONFIRMED')", r.dongSchema)
	var cnt int64
	if err := r.db.QueryRowContext(ctx, query, offerID).Scan(&cnt); err != nil {
		return false, err
	}
	return cnt > 0, nil
}

func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID int64, status string, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.orders
		SET status = $1, updated_at = NOW()
		WHERE order_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, status, orderID)
	return err
}

func (r *OrderRepository) CancelExpiredOrders(ctx context.Context, cutoff time.Time, tx *sql.Tx) (int64, error) {
	query := fmt.Sprintf(`
		WITH cancelled AS (
			UPDATE %s.orders
			SET status = 'CANCELED', updated_at = NOW()
			WHERE status = 'PENDING' AND created_at < $1
			RETURNING order_id, offer_id, amount
		),
		restored AS (
			UPDATE %s.offers o
			SET amount = o.amount + c.amount, updated_at = NOW()
			FROM cancelled c
			WHERE o.offer_id = c.offer_id
			RETURNING c.order_id
		)
		SELECT order_id FROM restored
	`, r.dongSchema, r.dongSchema)

	rows, err := tx.QueryContext(ctx, query, cutoff)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	var count int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err == nil {
			count++
		}
	}
	return count, rows.Err()
}

func (r *OrderRepository) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error) {
	base := fmt.Sprintf("SELECT order_id, offer_id, buyer_wallet_address, amount, price, status, transfer_code, expires_at, created_at, updated_at FROM %s.orders WHERE offer_id = $1", r.dongSchema)

	// Default ordering and pagination
	orderBy := "created_at"
	orderDir := "DESC"
	limit := 20
	offset := 0

	if pagination != nil {
		if v, ok := pagination["order_by"].(string); ok && v != "" {
			switch strings.ToLower(v) {
			case "created_at", "price", "amount":
				orderBy = v
			}
		}
		if od, ok := pagination["order"].(string); ok && (strings.EqualFold(od, "asc") || strings.EqualFold(od, "desc")) {
			orderDir = strings.ToUpper(od)
		}
		if l, ok := pagination["limit"].(int); ok && l > 0 {
			limit = l
		}
		if off, ok := pagination["offset"].(int); ok && off >= 0 {
			offset = off
		}
	}

	query := fmt.Sprintf("%s ORDER BY %s %s LIMIT $2 OFFSET $3", base, orderBy, orderDir)

	rows, err := r.db.QueryContext(ctx, query, offerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list orders: %w", err)
	}
	defer rows.Close()

	out := []models.Order{}
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.OrderID,
			&o.OfferID,
			&o.BuyerWalletAddress,
			&o.Amount,
			&o.Price,
			&o.Status,
			&o.TransferCode,
			&o.ExpiresAt,
			&o.CreatedAt,
			&o.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		out = append(out, o)
	}

	return out, rows.Err()
}

func (r *OrderRepository) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	query := fmt.Sprintf("SELECT order_id, offer_id, buyer_wallet_address, amount, price, status, transfer_code, expires_at, created_at, updated_at FROM %s.orders WHERE order_id = $1", r.dongSchema)
	var o models.Order
	row := r.db.QueryRowContext(ctx, query, id)
	if err := row.Scan(
		&o.OrderID,
		&o.OfferID,
		&o.BuyerWalletAddress,
		&o.Amount,
		&o.Price,
		&o.Status,
		&o.TransferCode,
		&o.ExpiresAt,
		&o.CreatedAt,
		&o.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &o, nil
}

// GetOrdersByWalletAddress returns all orders created by a wallet address (most recent first)
func (r *OrderRepository) GetOrdersByWalletAddress(ctx context.Context, walletAddress string) ([]models.Order, error) {
	query := fmt.Sprintf("SELECT order_id, offer_id, buyer_wallet_address, amount, price, status, transfer_code, expires_at, created_at, updated_at FROM %s.orders WHERE buyer_wallet_address = $1 ORDER BY created_at DESC", r.dongSchema)

	rows, err := r.db.QueryContext(ctx, query, walletAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to list orders by buyer_wallet_address: %w", err)
	}
	defer rows.Close()

	out := []models.Order{}
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.OrderID,
			&o.OfferID,
			&o.BuyerWalletAddress,
			&o.Amount,
			&o.Price,
			&o.Status,
			&o.TransferCode,
			&o.ExpiresAt,
			&o.CreatedAt,
			&o.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		out = append(out, o)
	}

	return out, rows.Err()
}
