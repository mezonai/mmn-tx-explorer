package models

import (
	"time"
)

type RedEnvelope struct {
	ID                   string    `json:"id" db:"id"`
	Name                 string    `json:"name" db:"name"`
	Description          *string   `json:"description,omitempty" db:"description"`
	TotalAmount          int64     `json:"total_amount" db:"total_amount"`
	MinAmount            *int64    `json:"min_amount,omitempty" db:"min_amount"`
	MaxAmount            *int64    `json:"max_amount,omitempty" db:"max_amount"`
	TotalClaims          int64     `json:"total_claims" db:"total_claims"`
	ClaimedCount         int64     `json:"claimed_count" db:"claimed_count"`
	RedEnvelopeWallet    string    `json:"red_envelope_wallet" db:"red_envelope_wallet"`
	OwnerWallet          string    `json:"owner_wallet" db:"owner_wallet"`
	Creator              int64     `json:"creator" db:"creator"`
	Status               string    `json:"status" db:"status"`
	TransactionHash      *string   `json:"transaction_hash,omitempty" db:"transaction_hash"`
	IsRandomDistribution bool      `json:"is_random_distribution" db:"is_random_distribution"`
	StartDate            time.Time `json:"start_date" db:"start_date"`
	EndDate              time.Time `json:"end_date" db:"end_date"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

type IntermediaryWallet struct {
	ID                  int64     `json:"id" db:"id"`
	WalletAddress       string    `json:"wallet_address" db:"wallet_address"`
	EncryptedPrivateKey string    `json:"-" db:"encrypted_private_key"`
	Status              string    `json:"status" db:"status"`
	Type                string    `json:"type" db:"type"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
}

type CreateRedEnvelopeRequest struct {
	Name                 string    `json:"name" binding:"required"`
	Description          *string   `json:"description,omitempty"`
	TotalAmount          int64     `json:"total_amount" binding:"required"`
	MinAmount            *int64    `json:"min_amount,omitempty"`
	MaxAmount            *int64    `json:"max_amount,omitempty"`
	TotalClaims          int64     `json:"total_claims" binding:"required"`
	OwnerWallet          string    `json:"owner_wallet" binding:"required"`
	IsRandomDistribution bool      `json:"is_random_distribution"`
	StartDate            time.Time `json:"start_date" binding:"required"`
	EndDate              time.Time `json:"end_date" binding:"required"`
}

type RedEnvelopeClaim struct {
	ID              int64     `json:"id" db:"id"`
	Description     *string   `json:"description,omitempty" db:"description"`
	RedEnvelopeID   string    `json:"red_envelope_id" db:"red_envelope_id"`
	ClaimerWallet   string    `json:"claimer_wallet" db:"claimer_wallet"`
	ClaimerUserID   *int64    `json:"claimer_user_id,omitempty" db:"claimer_user_id"`
	Amount          int64     `json:"amount" db:"amount"`
	Status          string    `json:"status" db:"status"`
	ClaimedAt       time.Time `json:"claimed_at" db:"claimed_at"`
	TransactionHash *string   `json:"transaction_hash,omitempty" db:"transaction_hash"`
}

type CreateRedEnvelopeCreateByUser []struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	TotalAmount  int64     `json:"total_amount"`
	TotalClaims  int64     `json:"total_claims"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	ClaimedCount int64     `json:"claimed_count"`
}

type ClaimedRedEnvelopeByUser []struct {
	ID              string    `json:"id"`
	RedEnvelopeID   string    `json:"red_envelope_id"`
	Name            string    `json:"name"`
	FromWallet      string    `json:"from_wallet"`
	Amount          int64     `json:"amount"`
	ClaimedAt       time.Time `json:"claimed_at"`
	TransactionHash *string   `json:"transaction_hash,omitempty"`
}

type DetailRedEnvelope struct {
	Name               string    `json:"name"`
	Status             string    `json:"status"`
	RedEnvelopeWallet  string    `json:"red_envelope_wallet"`
	TotalAmount        int64     `json:"total_amount"`
	TotalClaim         int64     `json:"total_claim"`
	ClaimedCount       int64     `json:"claimed_count"`
	TotalClaimedAmount int64     `json:"total_claimed_amount"`
	EndDate            time.Time `json:"end_date"`
}

type RedEnvelopeCloseSesssion struct {
	RemainingAmount   int64
	RedEnvelopeWallet string
	OwnerWallet       string
}

type ClaimRedEnvelopeRequest struct {
	SplitMoneyID int64 `json:"split_money_id" binding:"required"`
}
