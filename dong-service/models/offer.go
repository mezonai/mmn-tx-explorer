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
	OfferID                   int64       `json:"offer_id" db:"offer_id"`
	IntermediaryWalletAddress *string     `json:"intermediary_wallet_address,omitempty" db:"intermediary_wallet_address"`
	SellerWalletAddress       string      `json:"seller_wallet_address" db:"seller_wallet_address"`
	Side                      OfferSide   `json:"side" db:"side"` // BUY or SELL
	Symbol                    string      `json:"symbol" db:"symbol"`
	Amount                    int64       `json:"amount" db:"amount"` // numeric as string to support big ints
	TotalAmount               int64       `json:"total_amount" db:"total_amount"`
	Limit                     *OfferLimit `json:"limit,omitempty" db:"-"`
	Price                     int64       `json:"price" db:"price"`
	PriceRate                 *string     `json:"price_rate,omitempty" db:"price_rate"`
	PriceType                 string      `json:"price_type" db:"price_type"`
	Status                    string      `json:"status" db:"status"`
	BankInfo                  *string     `json:"bank_info,omitempty" db:"bank_info"`
	CreatedAt                 time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt                 time.Time   `json:"updated_at" db:"updated_at"`
}

// OfferLimit is the JSON-friendly per-transaction limit representation
type OfferLimit struct {
	Min int64 `json:"min"`
	Max int64 `json:"max"`
}

// CreateOfferRequest is the expected payload for the API request to create an offer
type CreateOfferRequest struct {
	IntermediaryWalletAddress *string                `json:"intermediary_wallet_address,omitempty"`
	Side                      OfferSide              `json:"side" binding:"required"` // BUY or SELL
	Symbol                    string                 `json:"symbol" binding:"required"`
	Amount                    string                 `json:"amount" binding:"required"`
	PriceRate                 *string                `json:"price_rate,omitempty"`
	PriceType                 *string                `json:"price_type,omitempty"` // FIXED or FLOAT
	BankInfo                  map[string]interface{} `json:"bank_info,omitempty"`
	Limit                     *OfferLimitRequest     `json:"limit,omitempty"`
}

type OfferLimitRequest struct {
	Min *string `json:"min,omitempty"`
	Max *string `json:"max,omitempty"`
}
