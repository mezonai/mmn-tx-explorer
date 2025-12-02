package common

import "time"

type DonationCampaignFeed struct {
	TxHash          string
	OwnerAddress    string
	CampaignAddress string
	ExtraInfo       string
	CreatedAt       time.Time
}
