package handlers

import (
	"dong-service/models"
	"dong-service/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// DonationCampaignHandler handles HTTP requests for donation campaigns
type DonationCampaignHandler struct {
	repo *repository.DonationCampaignRepository
}

// NewDonationCampaignHandler creates a new donation campaign handler
func NewDonationCampaignHandler(repo *repository.DonationCampaignRepository) *DonationCampaignHandler {
	return &DonationCampaignHandler{repo: repo}
}

// CreateCampaign godoc
// @Summary Create a new donation campaign
// @Description Create a new donation campaign
// @Tags campaigns
// @Accept json
// @Produce json
// @Param campaign body models.CreateDonationCampaignRequest true "Campaign data"
// @Success 201 {object} models.Response{data=models.DonationCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/prv_campaigns [post]
func (h *DonationCampaignHandler) CreateCampaign(c *gin.Context) {
	var req models.CreateDonationCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid request body: "+err.Error()))
		return
	}

	campaign, err := h.repo.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to create campaign: "+err.Error()))
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Code:    http.StatusCreated,
		Message: "Campaign created successfully",
		Data:    campaign.ToResponse(),
	})
}

// GetCampaign godoc
// @Summary Get a donation campaign by ID
// @Description Get details of a specific donation campaign
// @Tags campaigns
// @Produce json
// @Param id path int true "Campaign ID"
// @Success 200 {object} models.Response{data=models.DonationCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/pub_campaigns/{id} [get]
func (h *DonationCampaignHandler) GetCampaign(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid campaign ID: "+err.Error()))
		return
	}

	campaign, err := h.repo.GetByID(id)
	if err != nil {
		if err.Error() == "donation campaign not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "Campaign not found: "+err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to get campaign: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    http.StatusOK,
		Message: "Campaign retrieved successfully",
		Data:    campaign.ToResponse(),
	})
}

// ListCampaigns godoc
// @Summary List all donation campaigns
// @Description Get a list of all donation campaigns with pagination
// @Tags campaigns
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} models.Response{data=[]models.DonationCampaignResponse}
// @Failure 500 {object} models.Response
// @Router /api/v1/pub_campaigns [get]
func (h *DonationCampaignHandler) ListCampaigns(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	order := c.DefaultQuery("order", "desc")
	var statusPtr *int16
	if s := c.Query("status"); s != "" {
		if v, err := strconv.Atoi(s); err == nil {
			vv := int16(v)
			statusPtr = &vv
		}
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	campaigns, err := h.repo.GetAll(limit, offset, statusPtr, order)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to get campaigns: "+err.Error()))
		return
	}

	// Get total count
	total, err := h.repo.Count(statusPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to count campaigns: "+err.Error()))
		return
	}

	// Convert to response format
	responses := make([]models.DonationCampaignResponse, len(campaigns))
	for i, campaign := range campaigns {
		responses[i] = campaign.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Campaigns retrieved successfully",
		"data":    responses,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// UpdateCampaign godoc
// @Summary Update a donation campaign
// @Description Update an existing donation campaign
// @Tags campaigns
// @Accept json
// @Produce json
// @Param id path int true "Campaign ID"
// @Param campaign body models.UpdateDonationCampaignRequest true "Campaign data"
// @Success 200 {object} models.Response{data=models.DonationCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/prv_campaigns/{id} [put]
func (h *DonationCampaignHandler) UpdateCampaign(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid campaign ID: "+err.Error()))
		return
	}

	var req models.UpdateDonationCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid request body: "+err.Error()))
		return
	}

	campaign, err := h.repo.Update(id, &req)
	if err != nil {
		if err.Error() == "donation campaign not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "Campaign not found: "+err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to update campaign: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    http.StatusOK,
		Message: "Campaign updated successfully",
		Data:    campaign.ToResponse(),
	})
}

// ActivateCampaign godoc
// @Summary Activate a donation campaign
// @Description Set campaign status to Active
// @Tags campaigns
// @Produce json
// @Param id path int true "Campaign ID"
// @Success 200 {object} models.Response{data=models.DonationCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/prv_campaigns/{id}/activate [patch]
func (h *DonationCampaignHandler) ActivateCampaign(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid campaign ID: "+err.Error()))
		return
	}

	campaign, err := h.repo.Activate(id)
	if err != nil {
		if err.Error() == "donation campaign not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "Campaign not found: "+err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to activate campaign: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    http.StatusOK,
		Message: "Campaign activated successfully",
		Data:    campaign.ToResponse(),
	})
}

// CloseCampaign godoc
// @Summary Close a donation campaign
// @Description Set campaign status to Closed
// @Tags campaigns
// @Produce json
// @Param id path int true "Campaign ID"
// @Success 200 {object} models.Response{data=models.DonationCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/prv_campaigns/{id}/close [patch]
func (h *DonationCampaignHandler) CloseCampaign(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid campaign ID: "+err.Error()))
		return
	}

	campaign, err := h.repo.Close(id)
	if err != nil {
		if err.Error() == "donation campaign not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "Campaign not found: "+err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to close campaign: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    http.StatusOK,
		Message: "Campaign closed successfully",
		Data:    campaign.ToResponse(),
	})
}
