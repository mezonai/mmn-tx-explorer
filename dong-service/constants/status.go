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
