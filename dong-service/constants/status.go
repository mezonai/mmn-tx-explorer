package constants

// Donation Campaign Status Constants
const (
	// CampaignStatusDraft represents a draft campaign (not yet published)
	CampaignStatusDraft int16 = 0

	// CampaignStatusActive represents an active campaign (published and accepting donations)
	CampaignStatusActive int16 = 1

	// CampaignStatusClosed represents a closed campaign (no longer accepting donations)
	CampaignStatusClosed int16 = 2
)

// Transaction Status Constants
const (
	// TransactionStatus_FINALIZED represents a finalized transaction
	TransactionStatus_FINALIZED int16 = 2
)

const (
	RedEnvelopeStatusPending   = "PENDING"   // Awaiting transaction confirmation
	RedEnvelopeStatusPublished = "PUBLISHED" // Active and claimable
	RedEnvelopeStatusExpired   = "EXPIRED"   // Session ended
	RedEnvelopeStatusFailed    = "FAILED"    // Transaction failed after retries
)

// Red Envelope Wallet Status Constants
const (
	RedEnvelopeWalletStatusReady          = "READY"           // Available for use
	RedEnvelopeWalletStatusInUse          = "IN_USE"          // Currently assigned to a red envelope
	RedEnvelopeWalletStatusPrepareReplace = "PREPARE_REPLACE" // Scheduled for replacement (>30 days old)
	RedEnvelopeWalletStatusDisabled       = "DISABLED"        // No longer usable
)

const (
	RedEnvelopeSplitMoneyStatusAvailable = "AVAILABLE"
	RedEnvelopeSplitMoneyStatusReserved  = "RESERVED"
	RedEnvelopeSplitMoneyStatusClaimed   = "CLAIMED"
)

const (
	WalletTypeDefault     = "DEFAULT"
	WalletTypeRedEnvelope = "LUCKY_MONEY"
)

// Red Envelope Configuration
const (
	RedEnvelopeInitialWalletPool  = 50 // Number of wallets to create on deployment
	RedEnvelopeWalletMaxAgeInDays = 30 // Maximum age for unused wallets before replacement
)

const (
	StatusPublished = 2
	StatusFailed    = 3
	StatusExpired   = 4
)

const (
	ExtraInfoLuckyMoney = `{"type":"lucky-money"}`
)

const (
	TextDataLuckyMoney = "Lucky Money fund"
)

// GetStatusName returns the human-readable name for a status code
func GetStatusName(status int16) string {
	switch status {
	case CampaignStatusDraft:
		return "Draft"
	case CampaignStatusActive:
		return "Active"
	case CampaignStatusClosed:
		return "Closed"
	default:
		return "Unknown"
	}
}

// IsValidStatus checks if the given status is valid
func IsValidStatus(status int16) bool {
	return status == CampaignStatusDraft ||
		status == CampaignStatusActive ||
		status == CampaignStatusClosed
}
