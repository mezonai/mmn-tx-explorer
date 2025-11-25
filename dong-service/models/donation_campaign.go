package models

import (
	"dong-service/constants"
	"fmt"
	"time"
)

// DonationCampaign represents a donation campaign
type DonationCampaign struct {
	ID                int64     `json:"id" db:"id"`
	Name              string    `json:"name" db:"name" binding:"required"`
	Slug              string    `json:"slug" db:"slug"`
	Description       *string   `json:"description,omitempty" db:"description"`
	Goal              *int64    `json:"goal,omitempty" db:"goal"`
	URL               *string   `json:"url,omitempty" db:"url"`
	EndDate           *string   `json:"end_date,omitempty" db:"end_date"`
	DonationWallet    string    `json:"donation_wallet" db:"donation_wallet" binding:"required"`
	Creator           int64     `json:"creator" db:"creator" binding:"required"`
	Owner             *string   `json:"owner,omitempty" db:"owner"`
	Verified          bool      `json:"verified" db:"verified"`
	Status            int16     `json:"status" db:"status"` // 0=Draft, 1=Active, 2=Closed
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
	TotalAmount       *int64    `json:"total_amount,omitempty" db:"total_amount"`
	TotalContributors *int32    `json:"total_contributors,omitempty" db:"total_contributor"`
	CurrentBalance    *string   `json:"current_balance,omitempty"`
}

// CreateDonationCampaignRequest represents the request body for creating a campaign
type CreateDonationCampaignRequest struct {
	Name           string  `json:"name" binding:"required"`
	Description    *string `json:"description,omitempty"`
	Goal           *int64  `json:"goal,omitempty"`
	URL            *string `json:"url,omitempty"`
	EndDate        *string `json:"end_date,omitempty"`
	DonationWallet string  `json:"donation_wallet" binding:"required"`
	Owner          *string `json:"owner,omitempty"`
}

// UpdateDonationCampaignRequest represents the request body for updating a campaign
type UpdateDonationCampaignRequest struct {
	Description *string `json:"description,omitempty"`
	Goal        *int64  `json:"goal,omitempty"`
	URL         *string `json:"url,omitempty"`
	EndDate     *string `json:"end_date,omitempty"`
}

// DonationCampaignResponse represents the response for a campaign
type DonationCampaignResponse struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	Slug              string  `json:"slug"`
	Description       *string `json:"description,omitempty"`
	Goal              *int64  `json:"goal,omitempty"`
	URL               *string `json:"url,omitempty"`
	EndDate           *string `json:"end_date,omitempty"`
	DonationWallet    string  `json:"donation_wallet"`
	Creator           string  `json:"creator"`
	Owner             *string `json:"owner,omitempty"`
	Verified          bool    `json:"verified"`
	Status            int16   `json:"status"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
	TotalAmount       *int64  `json:"total_amount,omitempty"`
	TotalContributors *int32  `json:"total_contributors,omitempty"`
	CurrentBalance    *string `json:"current_balance,omitempty"`
}

// ToResponse converts DonationCampaign to DonationCampaignResponse
func (dc *DonationCampaign) ToResponse() DonationCampaignResponse {
	return DonationCampaignResponse{
		ID:                fmt.Sprintf("%d", dc.ID),
		Name:              dc.Name,
		Slug:              dc.Slug,
		Description:       dc.Description,
		Goal:              dc.Goal,
		URL:               dc.URL,
		EndDate:           dc.EndDate,
		DonationWallet:    dc.DonationWallet,
		Creator:           fmt.Sprintf("%d", dc.Creator),
		Owner:             dc.Owner,
		Verified:          dc.Verified,
		Status:            dc.Status,
		CreatedAt:         dc.CreatedAt.Format(time.RFC3339),
		UpdatedAt:         dc.UpdatedAt.Format(time.RFC3339),
		TotalAmount:       dc.TotalAmount,
		TotalContributors: dc.TotalContributors,
		CurrentBalance:    dc.CurrentBalance,
	}
}

// IsDraft checks if the campaign is in draft status
func (dc *DonationCampaign) IsDraft() bool {
	return dc.Status == constants.CampaignStatusDraft
}

// IsActive checks if the campaign is active
func (dc *DonationCampaign) IsActive() bool {
	return dc.Status == constants.CampaignStatusActive
}

// IsClosed checks if the campaign is closed
func (dc *DonationCampaign) IsClosed() bool {
	return dc.Status == constants.CampaignStatusClosed
}

// GetStatusName returns the human-readable status name
func (dc *DonationCampaign) GetStatusName() string {
	return constants.GetStatusName(dc.Status)
}

// CampaignStatsResponse represents the response for campaign statistics
type CampaignStatsResponse struct {
	TotalCampaignsActive int64 `json:"total_campaigns_active"`
	TotalAmount          int64 `json:"total_amount"`
	TotalContributors    int64 `json:"total_contributors"`
}

// TopContributor represents a top contributor for a campaign
type TopContributor struct {
	SenderWallet string  `json:"sender_wallet"`
	TotalDonate  int64   `json:"total_donate"`
	Percentage   float64 `json:"percentage"`
}

// TopContributorsResponse represents the response for top contributors
type TopContributorsResponse struct {
	CampaignID   int64            `json:"campaign_id"`
	Contributors []TopContributor `json:"contributors"`
}

// SyncCampaignResponse represents the response for syncing a campaign
type SyncCampaignResponse struct {
	TotalAmount       int64 `json:"total_amount"`
	TotalContributors int64 `json:"total_contributors"`
}
