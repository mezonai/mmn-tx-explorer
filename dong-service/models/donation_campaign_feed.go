package models

import (
	"time"
)

type DonationCampaignFeed struct {
	ID              int64     `json:"id" db:"id"`
	TxHash          string    `json:"tx_hash" db:"tx_hash"`
	CreatorAddress  string    `json:"creator_address" db:"creator_address"`
	CampaignAddress string    `json:"campaign_address" db:"related_address"`
	Title           string    `json:"title" db:"title"`
	Description     string    `json:"description" db:"description"`
	ImageCIDs       []string  `json:"image_cids" db:"image_cids"`
	ParentHash      *string   `json:"parent_hash" db:"parent_hash"`
	RootHash        *string   `json:"root_hash" db:"root_hash"`
	Visible         bool      `json:"visible" db:"visible"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	RootCreatedAt   time.Time `json:"root_created_at" db:"root_created_at"`
}

type UploadedImageInfo struct {
	FileName string `json:"file_name"`
	FileCID  string `json:"file_cid"`
}

type UploadImageResponse struct {
	FolderCID string              `json:"folder_cid"`
	Files     []UploadedImageInfo `json:"files"`
}
