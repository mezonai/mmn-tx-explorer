package models

import (
	"dong-service/constants"
	"fmt"
	"time"
)

// DonationCampaign represents a donation campaign
type DonationCampaign struct {
	ID             int64     `json:"id" db:"id"`
	Name           string    `json:"name" db:"name" binding:"required"`
	Description    *string   `json:"description,omitempty" db:"description"`
	Goal           *int64    `json:"goal,omitempty" db:"goal"`
	URL            *string   `json:"url,omitempty" db:"url"`
	EndDate        *string   `json:"end_date,omitempty" db:"end_date"`
	DonationWallet string    `json:"donation_wallet" db:"donation_wallet" binding:"required"`
	Creator        int64     `json:"creator" db:"creator" binding:"required"`
	Status         int16     `json:"status" db:"status"` // 0=Draft, 1=Active, 2=Closed
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// CreateDonationCampaignRequest represents the request body for creating a campaign
type CreateDonationCampaignRequest struct {
	Name           string  `json:"name" binding:"required"`
	Description    *string `json:"description,omitempty"`
	Goal           *int64  `json:"goal,omitempty"`
	URL            *string `json:"url,omitempty"`
	EndDate        *string `json:"end_date,omitempty"`
	DonationWallet string  `json:"donation_wallet" binding:"required"`
}

// UpdateDonationCampaignRequest represents the request body for updating a campaign
type UpdateDonationCampaignRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	Goal        *int64  `json:"goal,omitempty"`
	URL         *string `json:"url,omitempty"`
	EndDate     *string `json:"end_date,omitempty"`
}

// DonationCampaignResponse represents the response for a campaign
type DonationCampaignResponse struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Description    *string `json:"description,omitempty"`
	Goal           *int64  `json:"goal,omitempty"`
	URL            *string `json:"url,omitempty"`
	EndDate        *string `json:"end_date,omitempty"`
	DonationWallet string  `json:"donation_wallet"`
	Creator        string  `json:"creator"`
	Status         int16   `json:"status"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}

// ToResponse converts DonationCampaign to DonationCampaignResponse
func (dc *DonationCampaign) ToResponse() DonationCampaignResponse {
	return DonationCampaignResponse{
		ID:             fmt.Sprintf("%d", dc.ID),
		Name:           dc.Name,
		Description:    dc.Description,
		Goal:           dc.Goal,
		URL:            dc.URL,
		EndDate:        dc.EndDate,
		DonationWallet: dc.DonationWallet,
		Creator:        fmt.Sprintf("%d", dc.Creator),
		Status:         dc.Status,
		CreatedAt:      dc.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      dc.UpdatedAt.Format(time.RFC3339),
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
