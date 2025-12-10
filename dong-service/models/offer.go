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
	SellerWalletAddress  string      `json:"seller_wallet_address" db:"seller_wallet_address"`
	Side                 OfferSide   `json:"side" db:"side"` // BUY or SELL
	Symbol               *string     `json:"symbol,omitempty" db:"symbol"`
	Amount               int64       `json:"amount" db:"amount"` // numeric as string to support big ints
	TotalAmount          int64       `json:"total_amount" db:"total_amount"`
	Limit                *OfferLimit `json:"limit,omitempty" db:"-"`
	Price                int64       `json:"price" db:"price"`
	PriceRate            *string     `json:"price_rate,omitempty" db:"price_rate"`
	PriceType            string      `json:"price_type" db:"price_type"`
	Status               string      `json:"status" db:"status"`
	BankInfo             *string     `json:"bank_info,omitempty" db:"bank_info"`
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
	Symbol               *string                `json:"symbol,omitempty"`
	Amount               string                 `json:"amount" binding:"required"`
	PriceRate            *string                `json:"price_rate,omitempty"`
	PriceType            *string                `json:"price_type,omitempty"` // FIXED or FLOAT
	BankInfo             map[string]interface{} `json:"bank_info,omitempty"`
	Limit                *OfferLimitRequest     `json:"limit,omitempty"`
}

type OfferLimitRequest struct {
	Min *string `json:"min,omitempty"`
	Max *string `json:"max,omitempty"`
}
