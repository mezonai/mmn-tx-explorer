package handlers

import (
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// CampaignStatisticsHandler handles HTTP requests for campaign statistics
type CampaignStatisticsHandler struct {
	statsRepo *repository.CampaignStatisticsRepository
}

// NewCampaignStatisticsHandler creates a new campaign statistics handler
func NewCampaignStatisticsHandler(statsRepo *repository.CampaignStatisticsRepository) *CampaignStatisticsHandler {
	return &CampaignStatisticsHandler{
		statsRepo: statsRepo,
	}
}

// GetStats godoc
// @Summary Get donation campaign statistics
// @Description Get overall statistics for all donation campaigns
// @Tags campaigns
// @Produce json
// @Success 200 {object} models.Response{data=models.CampaignStatsResponse}
// @Failure 500 {object} models.Response
// @Router /api/v1/stats/campaign [get]
func (h *CampaignStatisticsHandler) GetCampaignStats(c *gin.Context) {
	logger.Debug().Msg("Fetching campaign statistics")

	stats, err := h.statsRepo.GetStats()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get campaign statistics")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrFailedToGetCampaigns+": "+err.Error()))
		return
	}

	logger.Debug().
		Int64("total_campaigns_active", stats.TotalCampaignsActive).
		Int64("total_amount", stats.TotalAmount).
		Int64("total_contributors", stats.TotalContributors).
		Msg("Campaign statistics retrieved successfully")

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgCampaignsRetrieved, stats))
}

// SyncCampaign godoc
// @Summary Sync contributors and statistics for a campaign
// @Description Manually trigger synchronization of contributors and statistics for a specific campaign
// @Tags campaigns
// @Produce json
// @Param id path int true "Campaign ID"
// @Success 200 {object} models.Response{data=models.SyncCampaignResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/campaigns/{id}/sync [post]
func (h *CampaignStatisticsHandler) SyncCampaign(c *gin.Context) {
	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		logger.Error().Err(err).Msg("Invalid campaign ID for sync")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidCampaignID))
		return
	}

	logger.Info().Int64("campaign_id", id).Msg("Syncing campaign contributors and statistics")

	// Sync campaign contributors and statistics
	syncResponse, err := h.statsRepo.SyncCampaignByID(c.Request.Context(), id)
	if err != nil {
		logger.Error().Err(err).Int64("campaign_id", id).Msg("Failed to sync campaign")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to sync campaign: "+err.Error()))
		return
	}

	logger.Info().Int64("campaign_id", id).Int64("total_amount", syncResponse.TotalAmount).Int64("total_contributors", syncResponse.TotalContributors).Msg("Campaign synced successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Campaign synced successfully", syncResponse))
}
