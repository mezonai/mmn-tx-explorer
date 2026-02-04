package models

import "time"

type HotWalletSwap struct {
	ID                  int64     `json:"id" db:"id"`
	WalletAddress       string    `json:"wallet_address" db:"wallet_address"`
	EncryptedPrivateKey string    `json:"-" db:"encrypted_private_key"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
}

type HotWalletHistory struct {
	ID                   int64     `json:"id" db:"id"`
	UserID               int64     `json:"user_id" db:"user_id"`
	SendWalletAddress    string    `json:"send_wallet_address" db:"send_wallet_address"`
	ReceiveWalletAddress string    `json:"receive_wallet_address" db:"receive_wallet_address"`
	TxHash               string    `json:"tx_hash" db:"tx_hash"`
	Amount               float64   `json:"amount" db:"amount"`
	Type                 string    `json:"type" db:"type"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
}

type SwapRequest struct {
	Amount float64 `json:"amount" binding:"required"`
}

type SwapResponse struct {
	TxHash string  `json:"tx_hash"`
	Amount float64 `json:"amount"`
}

type HotWalletInfo struct {
	WalletAddress string `json:"wallet_address"`
	Type          string `json:"type"`
	Balance       int64  `json:"balance"`
}
