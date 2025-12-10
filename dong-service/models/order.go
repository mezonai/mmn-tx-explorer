package models

import "time"

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
	OrderID            int64      `json:"order_id" db:"order_id"`
	OfferID            *int64     `json:"offer_id,omitempty" db:"offer_id"`
	BuyerWalletAddress *string    `json:"buyer_wallet_address,omitempty" db:"buyer_wallet_address"`
	Amount             int64      `json:"amount" db:"amount"`
	Price              int64      `json:"price" db:"price"`
	Status             string     `json:"status" db:"status"`
	ExpiresAt          *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateOrderRequest struct {
	Amount string  `json:"amount" binding:"required"`
	Price  *string `json:"price,omitempty"`
}
