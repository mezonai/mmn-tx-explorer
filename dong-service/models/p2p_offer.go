package models

import (
	"dong-service/types"
	"dong-service/utils"
	"encoding/json"
	"time"
)

// Offer represents a trading offer placed in the system
type OfferSide string

const (
	OfferSideBuy  OfferSide = "BUY"
	OfferSideSell OfferSide = "SELL"
)

type Offer struct {
	OfferID                   int64              `json:"offer_id" db:"offer_id"`
	OfferCreatorUserID        string             `json:"offer_creator_user_id" db:"offer_creator_user_id"`
	IntermediaryWalletAddress *string            `json:"intermediary_wallet_address,omitempty" db:"intermediary_wallet_address"`
	OfferCreatorWalletAddress *string             `json:"offer_creator_wallet_address" db:"offer_creator_wallet_address"`
	Side                      OfferSide          `json:"side" db:"side"` // BUY or SELL
	Symbol                    string             `json:"symbol" db:"symbol"`
	AvailableAmount           types.BigIntString `json:"amount" db:"available_amount"` // numeric as string to support big ints
	TotalAmount               types.BigIntString `json:"total_amount" db:"total_amount"`
	Limit                     *OfferLimit        `json:"limit,omitempty" db:"-"`
	PayableAmount             types.BigIntString `json:"payable_amount" db:"payable_amount"`
	PriceRate                 *float64           `json:"price_rate,omitempty" db:"price_rate"`
	Status                    string             `json:"status" db:"status"`
	BankInfo                  *string            `json:"bank_info,omitempty" db:"bank_info"`
	HasActiveOrder            *bool              `json:"has_active_order,omitempty" db:"-"` // Not stored in DB, computed on demand
	CreatedAt                 time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt                 time.Time          `json:"updated_at" db:"updated_at"`
}

// OfferLimit is the JSON-friendly per-transaction limit representation
type OfferLimit struct {
	Min types.BigIntString `json:"min"`
	Max types.BigIntString `json:"max"`
}

type OfferLimitRequest struct {
	Min int64 `json:"min"`
	Max int64 `json:"max"`
}

// CreateOfferRequest is the expected payload for the API request to create an offer
type CreateOfferRequest struct {
	Side      OfferSide              `json:"side" binding:"required,oneof=BUY SELL"` // BUY or SELL
	Symbol    string                 `json:"symbol" binding:"required"`
	Amount    int64                  `json:"amount" binding:"required"`
	PriceRate *string                `json:"price_rate,omitempty"`
	BankInfo  map[string]interface{} `json:"bank_info,omitempty"`
	Limit     *OfferLimitRequest     `json:"limit,omitempty"`
}

type UpdateOfferStatusRequest struct {
	OfferID int64  `json:"offer_id" binding:"required"`
	Status  string `json:"status" binding:"required"`
	TxHash  string `json:"tx_hash" binding:"required"`
}

func (o Offer) MarshalJSON() ([]byte, error) {
	type Alias Offer
	aux := &struct {
		BankInfo interface{} `json:"bank_info,omitempty"`
		*Alias
	}{
		Alias:    (*Alias)(&o),
		BankInfo: utils.ParseBankInfoString(o.BankInfo),
	}

	return json.Marshal(aux)
}
