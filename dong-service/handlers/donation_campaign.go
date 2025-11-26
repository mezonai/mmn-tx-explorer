package handlers

import (
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"errors"
	"net/http"
	"strconv"
	"strings"

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
		logger.Error().Err(err).Msg("Unauthorized campaign creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	var req models.CreateDonationCampaignRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		logger.Error().Err(bindErr).Int64("user_id", userID).Msg("Invalid request body for campaign creation")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+bindErr.Error()))
		return
	}

	// Validate goal is not negative
	if req.Goal != nil && *req.Goal < 0 {
		logger.Error().Int64("user_id", userID).Int64("goal", *req.Goal).Msg("Invalid goal amount: goal cannot be negative")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidGoalAmount))
		return
	}

	logger.Info().Int64("user_id", userID).Str("name", req.Name).Msg("Creating new donation campaign")

	campaign, err := h.repo.Create(&req, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Str("name", req.Name).Msg("Failed to create campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToCreateCampaign+": "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", campaign.ID).Str("name", campaign.Name).Msg("Campaign created successfully")
	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage(constants.MsgCampaignCreated, campaign.ToResponse()))
}

// CreateAndActiveCampaign godoc
// @Summary Create and immediately activate a new donation campaign
// @Description Create a new donation campaign and set its status to Active
// @Tags campaigns
// @Accept json
// @Produce json
// @Param campaign body models.CreateDonationCampaignRequest true "Campaign data"
// @Success 201 {object} models.Response{data=models.DonationCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/admin/campaigns/create-active [post]
func (h *DonationCampaignHandler) CreateAndActiveCampaign(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized campaign creation and activation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	var req models.CreateDonationCampaignRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		logger.Error().Err(bindErr).Int64("user_id", userID).Msg("Invalid request body for campaign creation and activation")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+bindErr.Error()))
		return
	}

	// Validate goal is not negative
	if req.Goal != nil && *req.Goal < 0 {
		logger.Error().Int64("user_id", userID).Int64("goal", *req.Goal).Msg("Invalid goal amount: goal cannot be negative")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidGoalAmount))
		return
	}

	logger.Info().Int64("user_id", userID).Str("name", req.Name).Msg("Creating and activating new donation campaign")

	campaign, err := h.repo.CreateAndActive(&req, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Str("name", req.Name).Msg("Failed to create and activate campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToCreateAndActiveCampaign+": "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", campaign.ID).Str("name", campaign.Name).Msg("Campaign created and activated successfully")
	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage(constants.MsgCampaignCreatedAndActivated, campaign.ToResponse()))
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
		logger.Error().Err(err).Msg("Invalid campaign ID parameter")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	logger.Debug().Int64("campaign_id", id).Msg("Fetching campaign details")

	campaign, err := h.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			logger.Warn().Int64("campaign_id", id).Msg("Campaign not found")
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, constants.ErrCampaignNotFound))
			return
		}
		logger.Error().Err(err).Int64("campaign_id", id).Msg("Failed to get campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaign+": "+err.Error()))
		return
	}

	logger.Debug().Int64("campaign_id", id).Str("name", campaign.Name).Msg("Campaign retrieved successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignRetrieved, campaign.ToResponse()))
}

// ListCampaigns godoc
// @Summary List all donation campaigns
// @Description Get a list of all donation campaigns with pagination
// @Tags campaigns
// @Produce json
// @Param page query int false "Page number" default(0)
// @Param limit query int false "Items per page" default(10)
// @Param status query int false "Filter by status (e.g., 0=draft,1=active,2=closed)"
// @Param order query string false "Sort direction" Enums(asc,desc) default(desc)
// @Param order_by query string false "Sort field" Enums(created_at,total_amount) default(created_at)
// @Param q query string false "Search (name or description)"
// @Param search query string false "Search (name or description) (alias)"
// @Success 200 {object} models.PaginatedResponse{data=[]models.DonationCampaignResponse, meta=models.PaginationMeta}
// @Failure 500 {object} models.Response
// @Router /api/v1/campaigns [get]
func (h *DonationCampaignHandler) ListCampaigns(c *gin.Context) {
	pagination := utils.GetPaginationParams(c)
	statusPtr := utils.ParseInt16Query(c, "status")
	// parse verified flag if present
	var verifiedPtr *bool
	if v := c.Query("verified"); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			verifiedPtr = &b
		}
	}

	// parse search query if present (accept q or search for backward compatibility)
	var qPtr *string
	if qs := strings.TrimSpace(c.Query("q")); qs != "" {
		qPtr = &qs
	} else if s := strings.TrimSpace(c.Query("search")); s != "" {
		qPtr = &s
	}

	logger.Debug().
		Int("page", pagination.Page).
		Int("limit", pagination.Limit).
		Interface("status", statusPtr).
		Str("order", pagination.Order).
		Str("order_by", pagination.OrderBy).
		Msg("Listing campaigns")

	campaigns, err := h.repo.GetAll(statusPtr, verifiedPtr, qPtr, pagination)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get campaigns list")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaigns+": "+err.Error()))
		return
	}

	// Get total count
	total, err := h.repo.Count(statusPtr, verifiedPtr, qPtr)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to count campaigns")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaigns+": "+err.Error()))
		return
	}

	// Convert to response format
	responses := make([]models.DonationCampaignResponse, len(campaigns))
	for i := range campaigns {
		responses[i] = campaigns[i].ToResponse()
	}

	logger.Debug().Int("count", len(campaigns)).Int64("total", total).Msg("Campaigns retrieved successfully")
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
		logger.Error().Err(err).Msg("Unauthorized campaign update attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Invalid campaign ID for update")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	var req models.UpdateDonationCampaignRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		logger.Error().Err(bindErr).Int64("user_id", userID).Int64("campaign_id", id).Msg("Invalid request body for campaign update")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+bindErr.Error()))
		return
	}

	// Validate goal is not negative
	if req.Goal != nil && *req.Goal < 0 {
		logger.Error().Int64("user_id", userID).Int64("goal", *req.Goal).Msg("Invalid goal amount: goal cannot be negative")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidGoalAmount))
		return
	}

	// Check if campaign exists and belongs to creator
	_, err = h.repo.GetByIDAndCreator(id, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Campaign not found or no permission to update")
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, constants.ErrCampaignNotFoundOrNoPermission))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Msg("Updating campaign")

	campaign, err := h.repo.Update(id, userID, &req)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Failed to update campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToUpdateCampaign+": "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Str("name", campaign.Name).Msg("Campaign updated successfully")
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
		logger.Error().Err(err).Msg("Unauthorized campaign activation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Invalid campaign ID for activation")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	// Check if campaign exists and belongs to creator
	campaign, err := h.repo.GetByIDAndCreator(id, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Campaign not found or no permission to activate")
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, constants.ErrCampaignNotFoundOrNoPermission))
		return
	}

	// Only activate Drafted or Closed Campaign
	if campaign.Status == constants.CampaignStatusActive {
		logger.Error().Int64("user_id", userID).Int64("campaign_id", id).Int16("status", campaign.Status).Msg("Cannot activate campaign with current status")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Only draft or closed campaigns can be activated"))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Msg("Activating campaign")

	campaign, err = h.repo.Activate(id, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Failed to activate campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToActivateCampaign+": "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Str("name", campaign.Name).Msg("Campaign activated successfully")
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
		logger.Error().Err(err).Msg("Unauthorized campaign close attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Invalid campaign ID for closing")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	// Check if campaign exists and belongs to creator
	campaign, err := h.repo.GetByIDAndCreator(id, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Campaign not found or no permission to close")
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, constants.ErrCampaignNotFoundOrNoPermission))
		return
	}

	// Only close Activated campaigns
	if campaign.Status != constants.CampaignStatusActive {
		logger.Error().Int64("user_id", userID).Int64("campaign_id", id).Int16("status", campaign.Status).Msg("Cannot close campaign with current status")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Only activated campaigns can be closed"))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Msg("Closing campaign")

	campaign, err = h.repo.Close(id, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Failed to close campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToCloseCampaign+": "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Str("name", campaign.Name).Msg("Campaign closed successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignClosed, campaign.ToResponse()))
}

// GetTopContributors godoc
// @Summary Get top contributors for a campaign
// @Description Get the top contributors for a specific donation campaign
// @Tags campaigns
// @Produce json
// @Param id path int true "Campaign ID"
// @Param limit query int false "Number of top contributors to return" default(10) maximum(10)
// @Success 200 {object} models.Response{data=models.TopContributorsResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/campaigns/{id}/top-contributors [get]
func (h *DonationCampaignHandler) GetTopContributors(c *gin.Context) {
	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		logger.Error().Err(err).Msg("Invalid campaign ID parameter for top contributors")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	// Parse limit parameter with validation
	limit := 10 // default limit
	if limitStr := c.Query("limit"); limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			logger.Error().Err(err).Int64("campaign_id", id).Msg("Invalid limit parameter")
			c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid limit parameter"))
			return
		}

		// Enforce maximum limit of 10
		if limit > 10 {
			limit = 10
		}
		if limit < 1 {
			limit = 1
		}
	}

	logger.Debug().Int64("campaign_id", id).Int("limit", limit).Msg("Fetching top contributors")

	topContributors, err := h.repo.GetTopContributors(id, limit)
	if err != nil {
		logger.Error().Err(err).Int64("campaign_id", id).Msg("Failed to get top contributors")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to get top contributors: "+err.Error()))
		return
	}

	logger.Debug().
		Int64("campaign_id", id).
		Int("contributors_count", len(topContributors.Contributors)).
		Msg("Top contributors retrieved successfully")

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Top contributors retrieved successfully", topContributors))
}

// DeleteDraftCampaign godoc
// @Summary Delete a drafted campaign
// @Description Delete a drafted donation campaign (only the creator can delete)
// @Tags campaigns
// @Produce json
// @Param id path int true "Campaign ID"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 403 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/admin/campaigns/{id} [delete]
func (h *DonationCampaignHandler) DeleteDraftCampaign(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized campaign delete attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Invalid campaign ID for delete")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	// Check if campaign exists and belongs to creator
	campaign, err := h.repo.GetByIDAndCreator(id, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Campaign not found or no permission to delete")
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, constants.ErrCampaignNotFoundOrNoPermission))
		return
	}

	// Only delete draft campaigns
	if campaign.Status != constants.CampaignStatusDraft {
		logger.Error().Int64("user_id", userID).Int64("campaign_id", id).Int16("status", campaign.Status).Msg("Cannot delete non-draft campaign")
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, "Only draft campaigns can be deleted"))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Msg("Deleting campaign")

	if err := h.repo.DeleteDraft(id, userID); err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Int64("campaign_id", id).Msg("Failed to delete campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToDeleteDraftCampaign+": "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Int64("campaign_id", id).Msg("Campaign deleted successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgDraftCampaignDeleted, map[string]any{"id": id}))
}

// GetCampaignBySlug godoc
// @Summary Get a donation campaign by slug
// @Description Get details of a specific donation campaign by its slug
// @Tags campaigns
// @Produce json
// @Param slug path string true "Campaign slug"
// @Success 200 {object} models.Response{data=models.DonationCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/campaigns/slug/{slug} [get]
func (h *DonationCampaignHandler) GetCampaignBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		logger.Error().Msg("Empty campaign slug parameter")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	logger.Debug().Str("slug", slug).Msg("Fetching campaign details by slug")

	campaign, err := h.repo.GetBySlug(slug)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			logger.Warn().Str("slug", slug).Msg("Campaign not found")
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, constants.ErrCampaignNotFound))
			return
		}
		logger.Error().Err(err).Str("slug", slug).Msg("Failed to get campaign by slug")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaign+": "+err.Error()))
		return
	}

	logger.Debug().Str("slug", slug).Str("name", campaign.Name).Msg("Campaign retrieved successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignRetrieved, campaign.ToResponse()))
}
