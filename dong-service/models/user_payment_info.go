package models

import "time"

type UserPaymentInfo struct {
	ID            int64     `json:"id" db:"id"`
	UserID        string    `json:"user_id" db:"user_id"`
	BankName      string    `json:"bank_name" db:"bank_name" binding:"required"`
	AccountNumber string    `json:"account_number" db:"account_number" binding:"required"`
	AccountName   string    `json:"account_name" db:"account_name" binding:"required"`
	IsPrimary     bool      `json:"is_primary" db:"is_primary"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}
