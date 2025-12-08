package models

import "time"

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "PENDING"
	OrderStatusConfirmed OrderStatus = "CONFIRMED"
	OrderStatusOpen      OrderStatus = "OPEN"
	OrderStatusPartial   OrderStatus = "PARTIAL"
	OrderStatusFilled    OrderStatus = "FILLED"
	OrderStatusCanceled  OrderStatus = "CANCELED"
	OrderStatusFailed    OrderStatus = "FAILED"
)

type Order struct {
	OrderID int64  `json:"order_id" db:"order_id"`
	OfferID *int64 `json:"offer_id,omitempty" db:"offer_id"`
	// WalletAddress stores the requester's public address (previously user_id)
	WalletAddress *string `json:"wallet_address,omitempty" db:"wallet_address"`
	Quantity      int64   `json:"quantity" db:"quantity"`
	Amount        int64   `json:"amount" db:"amount"`
	Price         int64   `json:"price" db:"price"`
	Status        string  `json:"status" db:"status"`
	ExternalRef   *string `json:"external_ref,omitempty" db:"external_ref"`
	Metadata      *string `json:"metadata,omitempty" db:"metadata"`
	// OfferMetadata contains the metadata (JSON) from the linked offer, if any
	OfferMetadata *string    `json:"offer_metadata,omitempty" db:"-"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateOrderRequest struct {
	// Side, Symbol, PriceType, PriceReference, Spread fields removed from request — server derives needed info
	Quantity string  `json:"quantity" binding:"required"`
	Price    *string `json:"price,omitempty"`
	Amount   *string `json:"amount,omitempty"`
	// price_type / price_reference / spread removed
	ExternalRef *string                `json:"external_ref,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	ExpiresAt   *time.Time             `json:"expires_at,omitempty"`
}

// OrderHistory represents an event for an order (audit trail)
type OrderHistory struct {
	HistoryID      int64     `json:"history_id" db:"history_id"`
	OrderID        int64     `json:"order_id" db:"order_id"`
	EventType      string    `json:"event_type" db:"event_type"`
	Quantity       string    `json:"quantity" db:"quantity"`
	ExecutionPrice *string   `json:"execution_price,omitempty" db:"execution_price"`
	Source         *string   `json:"source,omitempty" db:"source"`
	Metadata       *string   `json:"metadata,omitempty" db:"metadata"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}
