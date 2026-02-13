package repository

import (
	"context"
	"database/sql"
	"dong-service/models"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
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
			INSERT INTO %s.p2p_orders (
				offer_id, order_creator_wallet_address, order_creator_user_id, order_amount, payable_amount, status, transfer_code, expires_at, bank_info, created_at, updated_at
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
        RETURNING order_id, created_at, updated_at
    `, r.dongSchema)

	return tx.QueryRowContext(ctx, query,
		order.OfferID,
		order.OrderCreatorWalletAddress,
		order.OrderCreatorUserID,
		order.OrderAmount,
		order.PayableAmount,
		order.Status,
		order.TransferCode,
		order.ExpiresAt,
		order.BankInfo,
	).Scan(&order.OrderID, &order.CreatedAt, &order.UpdatedAt)
}
func (r *OrderRepository) HasActiveOrders(ctx context.Context, offerID int64, tx *sql.Tx) (bool, error) {
	query := fmt.Sprintf("SELECT 1 FROM %s.p2p_orders WHERE offer_id = $1 AND status IN ('PENDING','OPEN') LIMIT 1 FOR UPDATE", r.dongSchema)
	var v int
	err := tx.QueryRowContext(ctx, query, offerID).Scan(&v)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func (r *OrderRepository) CountActiveOrdersByUser(ctx context.Context, buyerUserID string, tx *sql.Tx) (int, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.p2p_orders WHERE order_creator_user_id = $1 AND status IN ('PENDING','OPEN')", r.dongSchema)
	var count int
	err := tx.QueryRowContext(ctx, query, buyerUserID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID int64, status string, tx *sql.Tx) error {
	query := fmt.Sprintf(`
		UPDATE %s.p2p_orders
		SET status = $1, updated_at = NOW()
		WHERE order_id = $2
	`, r.dongSchema)

	_, err := tx.ExecContext(ctx, query, status, orderID)
	return err
}

func (r *OrderRepository) UpdateOrderStatusWithTxHash(ctx context.Context, orderID int64, status string, txHash *string, tx *sql.Tx) error {
	if txHash != nil {
		query := fmt.Sprintf(`
			UPDATE %s.p2p_orders
			SET status = $1, transaction_hash = $2, updated_at = NOW()
			WHERE order_id = $3
		`, r.dongSchema)
		_, err := tx.ExecContext(ctx, query, status, *txHash, orderID)
		return err
	}
	return r.UpdateOrderStatus(ctx, orderID, status, tx)
}

func (r *OrderRepository) CancelExpiredOrders(ctx context.Context, cutoff time.Time, tx *sql.Tx) (int64, error) {
	query := fmt.Sprintf(`
		WITH cancelled AS (
			UPDATE %s.p2p_orders
			SET status = 'CANCELED', updated_at = NOW()
			WHERE status IN ('OPEN', 'PENDING') AND expires_at < $1
			RETURNING order_id, offer_id, order_amount
		),
		restored AS (
			UPDATE %s.p2p_offers o
			SET available_amount = o.available_amount + c.order_amount, updated_at = NOW()
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
	base := fmt.Sprintf(`
		SELECT o.order_id, o.offer_id, o.order_creator_wallet_address, o.order_creator_user_id, o.order_amount, o.payable_amount, 
		       o.transaction_hash, o.status, o.transfer_code, o.expires_at, o.created_at, o.updated_at,
		       of.offer_creator_wallet_address, of.offer_creator_user_id
		FROM %s.p2p_orders o
		LEFT JOIN %s.p2p_offers of ON o.offer_id = of.offer_id
		WHERE o.offer_id = $1`, r.dongSchema, r.dongSchema)

	// Default ordering and pagination
	orderBy := "created_at"
	orderDir := "DESC"
	limit := 20
	offset := 0

	if pagination != nil {
		if v, ok := pagination["order_by"].(string); ok && v != "" {
			switch strings.ToLower(v) {
			case "created_at", "payable_amount", "order_amount":
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
			&o.OrderCreatorWalletAddress,
			&o.OrderCreatorUserID,
			&o.OrderAmount,
			&o.PayableAmount,
			&o.TransactionHash,
			&o.Status,
			&o.TransferCode,
			&o.ExpiresAt,
			&o.CreatedAt,
			&o.UpdatedAt,
			&o.OfferCreatorWalletAddress,
			&o.OfferCreatorUserID,
		); err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		out = append(out, o)
	}

	return out, rows.Err()
}

func (r *OrderRepository) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	query := fmt.Sprintf("SELECT order_id, offer_id, order_creator_wallet_address, order_creator_user_id, order_amount, payable_amount, transaction_hash, status, transfer_code, expires_at, created_at, updated_at FROM %s.p2p_orders WHERE order_id = $1", r.dongSchema)
	var o models.Order
	row := r.db.QueryRowContext(ctx, query, id)
	if err := row.Scan(
		&o.OrderID,
		&o.OfferID,
		&o.OrderCreatorWalletAddress,
		&o.OrderCreatorUserID,
		&o.OrderAmount,
		&o.PayableAmount,
		&o.TransactionHash,
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

// GetOrdersByWalletAddress returns all orders where wallet is buyer OR seller (most recent first)
func (r *OrderRepository) GetOrdersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Order, error) {
	query := fmt.Sprintf(`
		SELECT o.order_id, o.offer_id, o.order_creator_wallet_address, o.order_creator_user_id, o.order_amount, o.payable_amount, 
		       o.transaction_hash, o.status, o.transfer_code, o.expires_at, o.created_at, o.updated_at,
		       of.offer_creator_wallet_address, of.offer_creator_user_id
		FROM %s.p2p_orders o
		LEFT JOIN %s.p2p_offers of ON o.offer_id = of.offer_id
		WHERE o.order_creator_wallet_address = $1 OR of.offer_creator_wallet_address = $1
		ORDER BY o.created_at DESC
	`, r.dongSchema, r.dongSchema)

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
		return nil, fmt.Errorf("failed to list orders by wallet_address: %w", err)
	}
	defer rows.Close()

	out := []models.Order{}
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.OrderID,
			&o.OfferID,
			&o.OrderCreatorWalletAddress,
			&o.OrderCreatorUserID,
			&o.OrderAmount,
			&o.PayableAmount,
			&o.TransactionHash,
			&o.Status,
			&o.TransferCode,
			&o.ExpiresAt,
			&o.CreatedAt,
			&o.UpdatedAt,
			&o.OfferCreatorWalletAddress,
			&o.OfferCreatorUserID,
		); err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		out = append(out, o)
	}

	return out, rows.Err()
}

func (r *OrderRepository) CountOrdersByWalletAddress(ctx context.Context, walletAddress string) (int64, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM %s.p2p_orders o
		LEFT JOIN %s.p2p_offers of ON o.offer_id = of.offer_id
		WHERE o.order_creator_wallet_address = $1 OR of.offer_creator_wallet_address = $1
	`, r.dongSchema, r.dongSchema)

	var total int64
	err := r.db.QueryRowContext(ctx, query, walletAddress).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to count orders by wallet_address: %w", err)
	}

	return total, nil
}

func (r *OrderRepository) CountOrdersByOffer(ctx context.Context, offerID int64) (int64, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM %s.p2p_orders
		WHERE offer_id = $1
	`, r.dongSchema)

	var total int64
	err := r.db.QueryRowContext(ctx, query, offerID).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to count orders by offer: %w", err)
	}

	return total, nil
}

// HasActiveOrdersByOfferList checks which offers from the provided list have active orders.
// Returns a map where key is offer_id and value is true if that offer has active orders (PENDING or OPEN status).
func (r *OrderRepository) HasActiveOrdersByOfferList(ctx context.Context, offerIDs []int64) (map[int64]bool, error) {
	result := make(map[int64]bool)
	if len(offerIDs) == 0 {
		return result, nil
	}

	query := fmt.Sprintf(`
		SELECT DISTINCT offer_id 
		FROM %s.p2p_orders 
		WHERE offer_id = ANY($1) AND status IN ('PENDING', 'OPEN')
	`, r.dongSchema)

	rows, err := r.db.QueryContext(ctx, query, pq.Array(offerIDs))
	if err != nil {
		return nil, fmt.Errorf("failed to check active orders for offers: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var offerID int64
		if err := rows.Scan(&offerID); err != nil {
			return nil, fmt.Errorf("failed to scan offer_id: %w", err)
		}
		result[offerID] = true
	}

	return result, rows.Err()
}

func (r *OrderRepository) CountOrdersByOfferList(ctx context.Context, offerIDs []int64) (map[int64]int64, error) {
	result := make(map[int64]int64)
	if len(offerIDs) == 0 {
		return result, nil
	}

	query := fmt.Sprintf(`
		SELECT offer_id, COUNT(*) 
		FROM %s.p2p_orders 
		WHERE offer_id = ANY($1)
		GROUP BY offer_id
	`, r.dongSchema)

	rows, err := r.db.QueryContext(ctx, query, pq.Array(offerIDs))
	if err != nil {
		return nil, fmt.Errorf("failed to count orders for offers: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var offerID int64
		var count int64
		if err := rows.Scan(&offerID, &count); err != nil {
			return nil, fmt.Errorf("failed to scan offer_id and count: %w", err)
		}
		result[offerID] = count
	}

	return result, rows.Err()
}
