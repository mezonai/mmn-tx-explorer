package models

import (
	"fmt"
	"time"
)

type UserPaymentInfo struct {
	ID            int64      `json:"id" db:"id"`
	UserID        string     `json:"user_id" db:"user_id"`
	BankName      string     `json:"bank_name" db:"bank_name" binding:"required"`
	AccountNumber string     `json:"account_number" db:"account_number" binding:"required"`
	AccountName   string     `json:"account_name" db:"account_name" binding:"required"`
	IsPrimary     bool       `json:"is_primary" db:"is_primary"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// GetUserBankInfo converts UserPaymentInfo to bank_info JSON string
func (p *UserPaymentInfo) GetUserBankInfo() string {
	if p == nil {
		return ""
	}
	return fmt.Sprintf(`{"bank_name":"%s","account_number":"%s","account_name":"%s","is_primary":%t}`,
		p.BankName, p.AccountNumber, p.AccountName, p.IsPrimary)
}
