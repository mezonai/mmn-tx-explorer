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

//Donation Campaign Goal Constants
const (
	MinGoalAmount int64 = 0            // Minimum goal amount for a campaign
	MaxGoalAmount int64 = 100000000000 // Maximum goal amount for a campaign (100 billion)
)

const (
	MaxPaticipantCount int64 = 500 // Maximum participant count
)

// Transaction Status Constants
const (
	// TransactionStatusFINALIZED represents a finalized transaction
	TransactionStatusFINALIZED int16 = 2
)

// Blockchain Transaction Status Constants (from MMN SDK)
const (
	TxStatusPending   int32 = 0 // Transaction is pending
	TxStatusConfirmed int32 = 1 // Transaction is confirmed
	TxStatusFinalized int32 = 2 // Transaction is finalized
	TxStatusFailed    int32 = 3 // Transaction failed
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
	WalletTypeOffer       = "OFFER"
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
	RedEnvelopeQueueStatusUserAlreadyInQueue = "ALREADY_QUEUED"
	RedEnvelopeQueueStatusLimitReached       = "LIMIT_REACHED"
	RedEnvelopeQueueStatusNotInitialize      = "QUEUE_NOT_INITIALIZE"
	RedEnvelopeStatusOk                      = "OK"
)

const (
	ClaimStatusError         = 0
	ClaimStatusSuccess       = 1
	ClaimStatusAlreadyQueued = 2
)

const (
	ExtraInfoLuckyMoney              = `{"type":"lucky-money"}`
	ExtraInfoP2PTrading              = `{"type":"p2p-trading"}`
	ExtraInfoP2PTradingOfferCanceled = `{"type":"p2p-trading","action":"offer-canceled"}`
)

const (
	TextDataLuckyMoney = "Lucky Money fund"
	TextDataP2PTrading = "P2P Trading"
)

const (
	TradingOpen      = "OPEN"
	TradingPending   = "PENDING"
	TradingConfirmed = "CONFIRMED"
	TradingCanceled  = "CANCELED"
	TradingFailed    = "FAILED"
	TradingCompleted = "COMPLETED"
)

const (
	OfferSideSell = "SELL"
	OfferSideBuy = "BUY"
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

// Offer related constants
const (
	MaxPriceRateOffer         float64 = 1000000.0
	MaxLengthSymbol           int     = 64
	MaxTotalBankInfoSize      int     = 1024
	MaxIndividualBankInfoSize int     = 128
	MaxActiveOffersPerUser    int64   = 10
	MaxActiveOrdersPerUser    int     = 10
)

const (
	OrderExpirationDuration = 4
)
