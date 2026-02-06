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
			INSERT INTO %s.orders (
				offer_id, buyer_wallet_address, buyer_user_id, amount, payable_amount, status, transfer_code, expires_at, created_at, updated_at, offer_type, bank_info, seller_wallet_address, seller_user_id
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW(),$9,$10,$11,$12)
        RETURNING order_id, created_at, updated_at
    `, r.dongSchema)

	return tx.QueryRowContext(ctx, query,
		order.OfferID,
		order.BuyerWalletAddress,
		order.BuyerUserID,
		order.Amount,
		order.PayableAmount,
		order.Status,
		order.TransferCode,
		order.ExpiresAt,
		order.OfferType,
		order.BankInfo,
		order.SellerWalletAddress,
		order.SellerUserID,
	).Scan(&order.OrderID, &order.CreatedAt, &order.UpdatedAt)
}

func (r *OrderRepository) HasActiveOrders(ctx context.Context, offerID int64, tx *sql.Tx) (bool, error) {
	query := fmt.Sprintf("SELECT 1 FROM %s.orders WHERE offer_id = $1 AND status IN ('PENDING','OPEN') LIMIT 1 FOR UPDATE", r.dongSchema)
	var v int
	err := tx.QueryRowContext(ctx, query, offerID).Scan(&v)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func (r *OrderRepository) CountActiveOrdersByUser(ctx context.Context, buyerUserID string, tx *sql.Tx) (int, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.orders WHERE buyer_user_id = $1 AND status IN ('PENDING','OPEN')", r.dongSchema)
	var count int
	err := tx.QueryRowContext(ctx, query, buyerUserID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
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

func (r *OrderRepository) UpdateOrderStatusWithTxHash(ctx context.Context, orderID int64, status string, txHash *string, tx *sql.Tx) error {
	if txHash != nil {
		query := fmt.Sprintf(`
			UPDATE %s.orders
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
			UPDATE %s.orders
			SET status = 'CANCELED', updated_at = NOW()
			WHERE status IN ('OPEN', 'PENDING') AND expires_at < $1
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
	base := fmt.Sprintf("SELECT order_id, offer_id, buyer_wallet_address, buyer_user_id, amount, payable_amount, transaction_hash, status, transfer_code, expires_at, created_at, updated_at, offer_type, bank_info, seller_wallet_address, seller_user_id FROM %s.orders WHERE offer_id = $1", r.dongSchema)

	// Default ordering and pagination
	orderBy := "created_at"
	orderDir := "DESC"
	limit := 20
	offset := 0

	if pagination != nil {
		if v, ok := pagination["order_by"].(string); ok && v != "" {
			switch strings.ToLower(v) {
			case "created_at", "payable_amount", "amount":
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
			&o.BuyerUserID,
			&o.Amount,
			&o.PayableAmount,
			&o.TransactionHash,
			&o.Status,
			&o.TransferCode,
			&o.ExpiresAt,
			&o.CreatedAt,
			&o.UpdatedAt,
			&o.OfferType,
			&o.BankInfo,
			&o.SellerWalletAddress,
			&o.SellerUserID,
		); err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		out = append(out, o)
	}

	return out, rows.Err()
}

func (r *OrderRepository) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	query := fmt.Sprintf("SELECT order_id, offer_id, buyer_wallet_address, buyer_user_id, amount, payable_amount, transaction_hash, status, transfer_code, expires_at, created_at, updated_at, offer_type, bank_info, seller_wallet_address, seller_user_id FROM %s.orders WHERE order_id = $1", r.dongSchema)
	var o models.Order
	row := r.db.QueryRowContext(ctx, query, id)
	if err := row.Scan(
		&o.OrderID,
		&o.OfferID,
		&o.BuyerWalletAddress,
		&o.BuyerUserID,
		&o.Amount,
		&o.PayableAmount,
		&o.TransactionHash,
		&o.Status,
		&o.TransferCode,
		&o.ExpiresAt,
		&o.CreatedAt,
		&o.UpdatedAt,
		&o.OfferType,
		&o.BankInfo,
		&o.SellerWalletAddress,
		&o.SellerUserID,
	); err != nil {
		return nil, err
	}
	return &o, nil
}

// GetOrdersByWalletAddress returns all orders where wallet is buyer OR seller (most recent first)
func (r *OrderRepository) GetOrdersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Order, error) {
	query := fmt.Sprintf(`
		SELECT o.order_id, o.offer_id, o.buyer_wallet_address, o.buyer_user_id, o.amount, o.payable_amount, 
		       o.transaction_hash, o.status, o.transfer_code, o.expires_at, o.created_at, o.updated_at, o.offer_type, o.bank_info,
		       o.seller_wallet_address, o.seller_user_id
		FROM %s.orders o
		WHERE o.buyer_wallet_address = $1 OR o.seller_wallet_address = $1
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
			&o.BuyerWalletAddress,
			&o.BuyerUserID,
			&o.Amount,
			&o.PayableAmount,
			&o.TransactionHash,
			&o.Status,
			&o.TransferCode,
			&o.ExpiresAt,
			&o.CreatedAt,
			&o.UpdatedAt,
			&o.OfferType,
			&o.BankInfo,
			&o.SellerWalletAddress,
			&o.SellerUserID,
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
		FROM %s.orders o
		WHERE o.buyer_wallet_address = $1 OR o.seller_wallet_address = $1
	`, r.dongSchema, r.dongSchema)

	var total int64
	err := r.db.QueryRowContext(ctx, query, walletAddress).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to count orders by wallet_address: %w", err)
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
		FROM %s.orders 
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
