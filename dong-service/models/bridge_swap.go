package models

import (
	"time"
)

type BridgeConfig struct {
	BSCWSURL              string
	BSCRPCURL             string
	WMezonAddressContract string
	WMezonAddress         string
	OwnerPrivateKey       string
	StartBlock            uint64
	PollingInterval       time.Duration
	ConfirmationBlocks    uint64
	PrivateKeyBSC         string
}

type BridgeMemo struct {
	UserID    string `json:"user_id"`
	Signature string `json:"signature,omitempty"`
	ExtraInfo string `json:"extra_info,omitempty"`
}

type CreateSwapHistoryRequest struct {
	ID                   int64     `json:"id" db:"id"`
	UserID               int64     `json:"user_id" db:"user_id"`
	SendWalletAddress    string    `json:"send_wallet_address" db:"send_wallet_address"`
	ReceiveWalletAddress string    `json:"receive_wallet_address" db:"receive_wallet_address"`
	TxHash               string    `json:"tx_hash" db:"tx_hash"`
	Amount               float64   `json:"amount" db:"amount"`
	Type                 string    `json:"type" db:"type"`
}

