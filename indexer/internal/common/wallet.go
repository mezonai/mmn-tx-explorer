package common

import (
	"math/big"
	"time"
)

// Wallet represents a wallet/account in the system
type Wallet struct {
	Address     string    `json:"address" db:"address"`
	AccountNonce *uint64  `json:"account_nonce" db:"account_nonce"`
	Balance     *big.Int  `json:"balance" db:"balance"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// WalletModel represents a simplified Wallet structure for API responses
type WalletModel struct {
	Address     string `json:"address"`
	AccountNonce uint64 `json:"account_nonce"`
	Balance     string `json:"balance"`
	UpdatedAt   string `json:"updated_at"`
	CreatedAt   string `json:"created_at"`
}

// Serialize converts Wallet to WalletModel for API responses
func (w *Wallet) Serialize() WalletModel {
	nonce := uint64(0)
	if w.AccountNonce != nil {
		nonce = *w.AccountNonce
	}
	
	balance := "0"
	if w.Balance != nil {
		balance = w.Balance.String()
	}
	
	return WalletModel{
		Address:     w.Address,
		AccountNonce: nonce,
		Balance:     balance,
		UpdatedAt:   w.UpdatedAt.Format(time.RFC3339),
		CreatedAt:   w.CreatedAt.Format(time.RFC3339),
	}
}
