package dong_handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/mezonai/mmn-tx-explorer/indexer/api"
)


type CreateCampaignRequest struct {
	Name           string `json:"name" binding:"required"`
	Description    string `json:"description"`
	Goal           int    `json:"goal"`
	URL            string `json:"url"`
	EndDate        string `json:"end_date"`
	DonationWallet string `json:"donation_wallet" binding:"required"`
}

type GetCampaignResponse struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	Goal           int    `json:"goal"`
	URL            string `json:"url"`
	EndDate        string `json:"end_date"`
	DonationWallet string `json:"donation_wallet"`
}

type ListCampaignsResponse []GetCampaignResponse

type UpdateCampaignRequest struct {
	Goal        *int   `json:"goal,omitempty"`
	EndDate     string `json:"end_date,omitempty"`
	Description string `json:"description,omitempty"`
}	



func CreateCampaign(c *gin.Context) {
	handleCreateCampaign(c)
}

func GetCampaign(c *gin.Context) {
	handleGetCampaign(c)
}
func ListCampaigns(c *gin.Context) {
	handleListCampaigns(c)
}	

func UpdateCampaign(c *gin.Context) {
	handleUpdateCampaign(c)
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

func handleGetCampaign(c *gin.Context) {
	campaignID := c.Param("id")

	// TODO: Implement campaign retrieval logic
	// This is where you would:
	// 1. Fetch the campaign from database using campaignID
	// 2. Return the campaign data
	// For now, return a mock campaign data
	response := map[string]interface{}{
		"id":          campaignID,
		"name":        "Sample Campaign",
		"description": "This is a sample campaign description.",
		"goal":        10000,
		"url":         "https://example.com/campaign",
		"end_date":    "2024-12-31",
		"donation_wallet": "0xSampleDonationWalletAddress",
	}
	c.JSON(200, response)
}

func handleListCampaigns(c *gin.Context) {
	// TODO: Implement campaign listing logic
	// This is where you would:
	// 1. Fetch the list of campaigns from database ( default limit to 10 newest)
 	// 2. Return the list of campaigns
	// For now, return a mock list of campaigns
	response := []map[string]interface{}{
		{
			"id":          "1",
			"name":        "Sample Campaign 1",
			"description": "This is the first sample campaign.",
			"goal":        5000,
			"url":         "https://example.com/campaign1",
			"end_date":    "2024-11-30",
			"donation_wallet": "0xSampleDonationWalletAddress1",
		},
		{
			"id":          "2",
			"name":        "Sample Campaign 2",
			"description": "This is the second sample campaign.",
			"goal":        15000,
			"url":         "https://example.com/campaign2",
			"end_date":    "2024-12-31",
			"donation_wallet": "0xSampleDonationWalletAddress2",
		},
	}
	c.JSON(200, response)
}

func handleUpdateCampaign(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}
	campaignID := c.Param("id")

	// TODO: Implement campaign update logic
	// This is where you would:
	// 1. Validate the update data
	// 2. Update the campaign in database using campaignID
	// 3. Return the updated campaign
	// For now, return the received data as a response
	response := map[string]interface{}{
		"message": "Campaign updated successfully",
		"id":      campaignID,
		"data":    req,
	}
	c.JSON(200, response)
}
