package handlers

import (
	"dong-service/constants"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"errors"
	"net/http"

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
// @Security BearerAuth
// @Router /api/v1/admin/campaigns [post]
func (h *DonationCampaignHandler) CreateCampaign(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	var req models.CreateDonationCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}

	campaign, err := h.repo.Create(&req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToCreateCampaign+": "+err.Error()))
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage(constants.MsgCampaignCreated, campaign.ToResponse()))
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
// @Router /api/v1/campaigns/{id} [get]
func (h *DonationCampaignHandler) GetCampaign(c *gin.Context) {
	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	campaign, err := h.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, constants.ErrCampaignNotFound))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaign+": "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignRetrieved, campaign.ToResponse()))
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
// @Router /api/v1/campaigns [get]
func (h *DonationCampaignHandler) ListCampaigns(c *gin.Context) {
	pagination := utils.GetPaginationParams(c)
	statusPtr := utils.ParseInt16Query(c, "status")

	campaigns, err := h.repo.GetAll(pagination.Limit, pagination.Offset, statusPtr, pagination.Order)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaigns+": "+err.Error()))
		return
	}

	// Get total count
	total, err := h.repo.Count(statusPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaigns+": "+err.Error()))
		return
	}

	// Convert to response format
	responses := make([]models.DonationCampaignResponse, len(campaigns))
	for i, campaign := range campaigns {
		responses[i] = campaign.ToResponse()
	}

	c.JSON(http.StatusOK, models.PaginatedSuccessResponse(constants.MsgCampaignsRetrieved, responses, pagination.Page, pagination.Limit, total))
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
// @Security BearerAuth
// @Router /api/v1/admin/campaigns/{id} [put]
func (h *DonationCampaignHandler) UpdateCampaign(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	var req models.UpdateDonationCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}

	// Check if campaign exists and belongs to creator
	_, err = h.repo.GetByIDAndCreator(id, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, constants.ErrCampaignNotFoundOrNoPermission))
		return
	}

	campaign, err := h.repo.Update(id, userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToUpdateCampaign+": "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignUpdated, campaign.ToResponse()))
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
// @Security BearerAuth
// @Router /api/v1/admin/campaigns/{id}/activate [patch]
func (h *DonationCampaignHandler) ActivateCampaign(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	// Check if campaign exists and belongs to creator
	_, err = h.repo.GetByIDAndCreator(id, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, constants.ErrCampaignNotFoundOrNoPermission))
		return
	}

	campaign, err := h.repo.Activate(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToActivateCampaign+": "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignActivated, campaign.ToResponse()))
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
// @Security BearerAuth
// @Router /api/v1/admin/campaigns/{id}/close [patch]
func (h *DonationCampaignHandler) CloseCampaign(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	// Check if campaign exists and belongs to creator
	_, err = h.repo.GetByIDAndCreator(id, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, constants.ErrCampaignNotFoundOrNoPermission))
		return
	}

	campaign, err := h.repo.Close(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToCloseCampaign+": "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignClosed, campaign.ToResponse()))
}
