package models

import (
	"dong-service/types"
	"time"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "PENDING"
	OrderStatusConfirmed OrderStatus = "CONFIRMED"
	OrderStatusOpen      OrderStatus = "OPEN"
	OrderStatusCanceled  OrderStatus = "CANCELED"
	OrderStatusFailed    OrderStatus = "FAILED"
	OrderStatusCompleted OrderStatus = "COMPLETED"
)

type Order struct {
	OrderID                   int64              `json:"order_id" db:"order_id"`
	OfferID                   *int64             `json:"offer_id,omitempty" db:"offer_id"`
	OrderCreatorWalletAddress *string            `json:"order_creator_wallet_address,omitempty" db:"order_creator_wallet_address"`
	OrderCreatorUserID        string             `json:"order_creator_user_id" db:"order_creator_user_id"`
	OrderAmount               types.BigIntString `json:"amount" db:"order_amount"`
	PayableAmount             types.BigIntString `json:"payable_amount" db:"payable_amount"`
	TransactionHash           *string            `json:"transaction_hash,omitempty" db:"transaction_hash"`
	Status                    string             `json:"status" db:"status"`
	TransferCode              *string            `json:"transfer_code,omitempty" db:"transfer_code"`
	ExpiresAt                 *time.Time         `json:"expires_at,omitempty" db:"expires_at"`
	PaymentInfoID             *int64             `json:"payment_info_id,omitempty" db:"payment_info_id"`
	CreatedAt                 time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt                 time.Time          `json:"updated_at" db:"updated_at"`
	PaymentInfo               *UserPaymentInfo   `json:"payment_info,omitempty" db:"-"`
	BankInfo                  *string            `json:"bank_info,omitempty" db:"-"`
	OfferCreatorWalletAddress *string            `json:"offer_creator_wallet_address,omitempty" db:"-"`
	OfferCreatorUserID        string             `json:"offer_creator_user_id,omitempty" db:"-"`
	PriceRate                 *float64           `json:"price_rate,omitempty" db:"-"`
	OfferSide                 *OfferSide         `json:"side,omitempty" db:"-"`
}

type CreateOrderRequest struct {
	Amount        int64  `json:"amount" binding:"required"`
	PayableAmount *int64 `json:"payable_amount,omitempty"`
	PaymentInfoID *int64 `json:"payment_info_id,omitempty"`
}
