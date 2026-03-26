package models

import (
	"dong-service/constants"
	"fmt"
	"regexp"
	"strings"
	"time"
)

// accountNumberRe accepts digits only; length is enforced separately via constants.
var accountNumberRe = regexp.MustCompile(`^\d+$`)

// accountNameRe accepts Latin letters (upper/lower) and spaces; length is enforced separately via constants.
var accountNameRe = regexp.MustCompile(`^[A-Za-z][A-Za-z ]*$`)

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

// Validate checks business-level constraints beyond Gin's binding tags.
func (p *UserPaymentInfo) Validate() error {
	if !constants.IsSupportedBank(p.BankName) {
		return fmt.Errorf("bank_name %q is not supported; accepted values: %s",
			p.BankName, constants.SupportedBankNameList())
	}

	numLen := len(p.AccountNumber)
	if !accountNumberRe.MatchString(p.AccountNumber) || numLen < constants.MinAccountNumberLength || numLen > constants.MaxAccountNumberLength {
		return fmt.Errorf("account_number must contain only digits and be between %d and %d characters",
			constants.MinAccountNumberLength, constants.MaxAccountNumberLength)
	}

	trimmed := strings.TrimSpace(p.AccountName)
	nameLen := len(trimmed)
	if !accountNameRe.MatchString(trimmed) || nameLen < constants.MinAccountNameLength || nameLen > constants.MaxAccountNameLength {
		return fmt.Errorf("account_name must contain only Latin letters and spaces, between %d and %d characters",
			constants.MinAccountNameLength, constants.MaxAccountNameLength)
	}
	p.AccountName = trimmed

	return nil
}

// GetUserBankInfo converts UserPaymentInfo to bank_info JSON string
func (p *UserPaymentInfo) GetUserBankInfo() string {
	if p == nil {
		return ""
	}
	return fmt.Sprintf(`{"bank_name":"%s","account_number":"%s","account_name":"%s","is_primary":%t}`,
		p.BankName, p.AccountNumber, p.AccountName, p.IsPrimary)
}
