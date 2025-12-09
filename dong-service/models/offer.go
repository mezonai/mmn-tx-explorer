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
	OfferID              int64       `json:"offer_id" db:"offer_id"`
	IntermediaryWalletID int64       `json:"intermediary_wallet_id" db:"intermediary_wallet_id"`
	WalletAddress        string      `json:"wallet_address" db:"wallet_address"`
	Side                 OfferSide   `json:"side" db:"side"` // BUY or SELL
	Symbol               string      `json:"symbol" db:"symbol"`
	Quantity             int64       `json:"quantity" db:"quantity"` // numeric as string to support big ints
	TotalQuantity        int64       `json:"total_quantity" db:"total_quantity"`
	Limit                *OfferLimit `json:"limit,omitempty" db:"-"`
	Price                int64       `json:"price" db:"price"`
	PriceRate            *string     `json:"price_rate,omitempty" db:"price_rate"`
	PriceType            string      `json:"price_type" db:"price_type"`
	Status               string      `json:"status" db:"status"`
	Metadata             *string     `json:"metadata,omitempty" db:"metadata"`
	CreatedAt            time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time   `json:"updated_at" db:"updated_at"`
}

// OfferLimit is the JSON-friendly per-transaction limit representation
type OfferLimit struct {
	Min int64 `json:"min"`
	Max int64 `json:"max"`
}

// CreateOfferRequest is the expected payload for the API request to create an offer
type CreateOfferRequest struct {
	IntermediaryWalletID *int64                 `json:"intermediary_wallet_id,omitempty"`
	Side                 OfferSide              `json:"side" binding:"required"` // BUY or SELL
	Symbol               string                 `json:"symbol" binding:"required"`
	Quantity             string                 `json:"quantity" binding:"required"`
	PriceRate            *string                `json:"price_rate,omitempty"`
	PriceType            *string                `json:"price_type,omitempty"` // FIXED or FLOAT
	Metadata             map[string]interface{} `json:"metadata,omitempty"`
	Limit                *OfferLimitRequest     `json:"limit,omitempty"`
}

type OfferLimitRequest struct {
	Min *string `json:"min,omitempty"`
	Max *string `json:"max,omitempty"`
}
