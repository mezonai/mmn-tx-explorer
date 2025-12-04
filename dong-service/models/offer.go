package models

import (
	"time"
)

// Offer represents a trading offer placed in the system
type OfferSide string

const (
	OfferSideBuy  OfferSide = "BUY"
	OfferSideSell OfferSide = "SELL"
)

type Offer struct {
	OfferID              int64     `json:"offer_id" db:"offer_id"`
	IntermediaryWalletID int64     `json:"intermediary_wallet_id" db:"intermediary_wallet_id"`
	WalletAddress        string    `json:"wallet_address" db:"wallet_address"`
	Side                 OfferSide `json:"side" db:"side"` // BUY or SELL
	Symbol               string    `json:"symbol" db:"symbol"`
	Quantity             int64     `json:"quantity" db:"quantity"` // numeric as string to support big ints
	TotalQuantity        int64     `json:"total_quantity" db:"total_quantity"`
	Price                int64     `json:"price" db:"price"`
	PriceType            string    `json:"price_type" db:"price_type"`
	Status               string    `json:"status" db:"status"`
	Metadata             *string   `json:"metadata,omitempty" db:"metadata"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// OfferHistory represents an audit/event emitted for an offer
type OfferHistory struct {
	HistoryID      int64     `json:"history_id" db:"history_id"`
	OfferID        int64     `json:"offer_id" db:"offer_id"`
	EventType      string    `json:"event_type" db:"event_type"`
	Quantity       string    `json:"quantity" db:"quantity"`
	ExecutionPrice *string   `json:"execution_price,omitempty" db:"execution_price"`
	Source         *string   `json:"source,omitempty" db:"source"`
	Metadata       *string   `json:"metadata,omitempty" db:"metadata"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// CreateOfferRequest is the expected payload for the API request to create an offer
type CreateOfferRequest struct {
	IntermediaryWalletID *int64                 `json:"intermediary_wallet_id,omitempty"`
	Side                 OfferSide              `json:"side" binding:"required"` // BUY or SELL
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
