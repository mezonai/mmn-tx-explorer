package models

import (
	"time"
)

// Wallet represents wallet information
type Wallet struct {
	Address          string    `json:"address" db:"address"`
	AccountNonce     uint64    `json:"account_nonce" db:"account_nonce"`
	Balance          string    `json:"balance" db:"balance"`
	TransactionCount *int64    `json:"transaction_count,omitempty" db:"transaction_count"`
	LastBlock        *int64    `json:"last_balance_update,omitempty" db:"last_block"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

// WalletDetailResponse represents the response for wallet detail endpoint
type WalletDetailResponse struct {
	Address          string `json:"address"`
	AccountNonce     uint64 `json:"account_nonce"`
	Balance          string `json:"balance,omitempty"`
	TransactionCount *int64 `json:"transaction_count,omitempty"`
	LastBlock        *int64 `json:"last_balance_update,omitempty"`
	UpdatedAt        string `json:"updated_at"`
	CreatedAt        string `json:"created_at"`
}

// Serialize converts Wallet to WalletDetailResponse for API responses
func (w *Wallet) Serialize() WalletDetailResponse {
	return WalletDetailResponse{
		Address:          w.Address,
		AccountNonce:     w.AccountNonce,
		Balance:          w.Balance,
		TransactionCount: w.TransactionCount,
		LastBlock:        w.LastBlock,
		UpdatedAt:        w.UpdatedAt.Format(time.RFC3339),
		CreatedAt:        w.CreatedAt.Format(time.RFC3339),
	}
}
