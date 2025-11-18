package models

import (
	"time"
)

type BridgeConfig struct {
	BSCWSURL           string
	BSCRPCURL          string
	WMezonAddress      string
	OwnerPrivateKey    string
	StartBlock         uint64
	PollingInterval    time.Duration
	UsePolling         bool // true = polling, false = subscription
	ConfirmationBlocks uint64
}

type BridgeMemo struct {
    UserID     string `json:"user_id"`
    Signature  string `json:"signature,omitempty"`
	ExtraInfo  string `json:"extra_info,omitempty"`
}