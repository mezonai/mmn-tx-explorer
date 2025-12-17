package models

import (
	"dong-service/utils"
	"encoding/json"
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
	OrderID             int64      `json:"order_id" db:"order_id"`
	OfferID             *int64     `json:"offer_id,omitempty" db:"offer_id"`
	BuyerWalletAddress  *string    `json:"buyer_wallet_address,omitempty" db:"buyer_wallet_address"`
	BuyerUserID         int64      `json:"buyer_user_id" db:"buyer_user_id"`
	Amount              int64      `json:"amount" db:"amount"`
	PayableAmount       int64      `json:"payable_amount" db:"payable_amount"`
	TransactionHash     *string    `json:"transaction_hash,omitempty" db:"transaction_hash"`
	Status              string     `json:"status" db:"status"`
	TransferCode        *string    `json:"transfer_code,omitempty" db:"transfer_code"`
	ExpiresAt           *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
	BankInfo            *string    `json:"bank_info,omitempty" db:"-"`
	SellerWalletAddress *string    `json:"seller_wallet_address,omitempty" db:"-"`
	SellerUserID        *int64     `json:"seller_user_id,omitempty" db:"-"`
}

type CreateOrderRequest struct {
	Amount        int64  `json:"amount" binding:"required"`
	PayableAmount *int64 `json:"payable_amount,omitempty"`
}

func (o Order) MarshalJSON() ([]byte, error) {
	type Alias Order
	aux := &struct {
		BankInfo interface{} `json:"bank_info,omitempty"`
		*Alias
	}{
		Alias:    (*Alias)(&o),
		BankInfo: utils.ParseBankInfoString(o.BankInfo),
	}

	return json.Marshal(aux)
}
