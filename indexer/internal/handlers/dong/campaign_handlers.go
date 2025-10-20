package dong_handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/mezonai/mmn-tx-explorer/indexer/api"
)

// CreateCampaignRequest represents the request body for creating a campaign
type CreateCampaignRequest struct {
	Name           string `json:"name" binding:"required"`
	Description    string `json:"description"`
	Goal           int    `json:"goal"`
	URL            string `json:"url"`
	EndDate        string `json:"end_date"`
	DonationWallet string `json:"donation_wallet" binding:"required"`
}

func CreateCampaign(c *gin.Context) {
	handleCreateCampaign(c)
}

func handleCreateCampaign(c *gin.Context) {
	var req CreateCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	// TODO: Implement campaign creation logic
	// This is where you would:
	// 1. Validate the campaign data
	// 2. Save the campaign to database
	// 3. Return the created campaign

	// For now, return the received data as a response
	response := map[string]interface{}{
		"message": "Campaign created successfully",
		"data":    req,
	}

	c.JSON(201, response)
}
