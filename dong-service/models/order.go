package models

import (
	"time"
)

// Order represents a trading order placed in the system
type OrderSide string

const (
	OrderSideBuy  OrderSide = "BUY"
	OrderSideSell OrderSide = "SELL"
)

type Order struct {
	OrderID              int64      `json:"order_id" db:"order_id"`
	IntermediaryWalletID int64      `json:"intermediary_wallet_id" db:"intermediary_wallet_id"`
	UserID               *int64     `json:"user_id,omitempty" db:"user_id"`
	Side                 OrderSide  `json:"side" db:"side"` // BUY or SELL
	Symbol               string     `json:"symbol" db:"symbol"`
	Quantity             string     `json:"quantity" db:"quantity"` // numeric as string to support big ints
	Price                string     `json:"price" db:"price"`       // numeric as string
	FilledQuantity       string     `json:"filled_quantity" db:"filled_quantity"`
	PriceType            string     `json:"price_type" db:"price_type"`
	PriceReference       *string    `json:"price_reference,omitempty" db:"price_reference"`
	Spread               *string    `json:"spread,omitempty" db:"spread"`
	Status               string     `json:"status" db:"status"`
	ExternalRef          *string    `json:"external_ref,omitempty" db:"external_ref"`
	Metadata             *string    `json:"metadata,omitempty" db:"metadata"`
	ExpiresAt            *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
}

// OrderHistory represents an audit/event emitted for an order
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

// CreateOrderRequest is the expected payload for the API request to create an order
type CreateOrderRequest struct {
	IntermediaryWalletID *int64                 `json:"intermediary_wallet_id,omitempty"`
	UserID               *int64                 `json:"user_id,omitempty"`
	Side                 OrderSide              `json:"side" binding:"required"` // BUY or SELL
	Symbol               string                 `json:"symbol" binding:"required"`
	Quantity             string                 `json:"quantity" binding:"required"`
	Price                *string                `json:"price,omitempty"`
	PriceType            *string                `json:"price_type,omitempty"` // FIXED or FLOAT
	PriceReference       *string                `json:"price_reference,omitempty"`
	Spread               *string                `json:"spread,omitempty"`
	ExternalRef          *string                `json:"external_ref,omitempty"`
	Metadata             map[string]interface{} `json:"metadata,omitempty"`
	ExpiresAt            *time.Time             `json:"expires_at,omitempty"`
}
