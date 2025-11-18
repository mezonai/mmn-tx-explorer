package models

import "time"

type RedEnvelopeWallet struct {
	ID                  int64     `json:"id" db:"id"`
	WalletAddress       string    `json:"wallet_address" db:"wallet_address"`
	EncryptedPrivateKey string    `json:"-" db:"encrypted_private_key"`
	Status              string    `json:"status" db:"status"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
}