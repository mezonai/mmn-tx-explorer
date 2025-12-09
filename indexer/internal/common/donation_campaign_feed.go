package common

import "time"

type UserContent struct {
	Type            string    `json:"type"`
	TxHash          string    `json:"tx_hash"`
	CreatorAddress  string    `json:"creator_address"`
	CampaignAddress string    `json:"campaign_address"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	ImageCIDs       []string  `json:"image_cids"`
	ParentHash      string    `json:"parent_hash"`
	RootHash        string    `json:"root_hash"`
	CreatedAt       time.Time `json:"created_at"`
}
