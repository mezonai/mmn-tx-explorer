package models

import (
	"time"
    "encoding/json"
)

type FeedExtraInfo struct {
    Title       string   `json:"title"`
    Description string   `json:"description"`
    ImageCIDs   []string `json:"image_cids"`
}
type DonationCampaignFeed struct {
    ID             int64           `json:"id" db:"id"`
    TxHash         string          `json:"tx_hash" db:"tx_hash"`
    OwnerAddress   string          `json:"owner_address" db:"owner_address"`
    CampaignAddress string         `json:"campaign_address" db:"campaign_address"`
    ExtraInfo      json.RawMessage `json:"extra_info" db:"extra_info"` 
    CreatedAt      time.Time       `json:"created_at" db:"created_at"`
}
type DonationCampaignFeedResponse struct {
	ID             int64     `json:"id"`
	TxHash         string    `json:"tx_hash"`
	OwnerAddress   string    `json:"owner_address"`
	CampaignAddress string   `json:"campaign_address"`
	ExtraInfo      FeedExtraInfo `json:"extra_info"`
	CreatedAt      time.Time `json:"created_at"`
}