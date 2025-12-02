package handlers

import (
    "dong-service/logger"
    "dong-service/models"
    "dong-service/config"
    "dong-service/repository"
    "encoding/json"
    "net/http"
    "github.com/gin-gonic/gin"
)

type DonationCampaignFeedHandler struct {
	repo *repository.DonationCampaignFeedRepository
	cfg  *config.Config
}

func NewDonationCampaignFeedHandler(repo *repository.DonationCampaignFeedRepository, cfg *config.Config) *DonationCampaignFeedHandler {
	return &DonationCampaignFeedHandler{repo: repo, cfg: cfg}
}

// GetLatestCampaignFeed godoc
// @Summary Get latest feed of a campaign
// @Description Get the latest donation campaign feed by campaign address
// @Tags campaign_feed
// @Produce json
// @Param campaign_address path string true "Campaign address"
// @Success 200 {object} models.Response{data=models.DonationCampaignFeedResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/campaigns/latest-feed/{campaign_address} [get]
func (h *DonationCampaignFeedHandler) GetLatestCampaignFeed(c *gin.Context) {
    campaignAddr := c.Param("campaign_address")
    if campaignAddr == "" {
        logger.Error().Msg("Missing campaign_address parameter")
        c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing campaign_address"))
        return
    }

    feed, err := h.repo.GetLatestCampaignFeedByAddress(campaignAddr)
    if err != nil {
        logger.Error().Err(err).Str("campaign_address", campaignAddr).Msg("Failed to get latest campaign feed")
        c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Internal server error"))
        return
    }
    if feed == nil {
        logger.Warn().Str("campaign_address", campaignAddr).Msg("No feed found for campaign")
        c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "No feed found"))
        return
    }

    var extra models.FeedExtraInfo
    _ = json.Unmarshal(feed.ExtraInfo, &extra)

    resp := models.DonationCampaignFeedResponse{
        ID:              feed.ID,
        TxHash:          feed.TxHash,
        OwnerAddress:    feed.OwnerAddress,
        CampaignAddress: feed.CampaignAddress,
        CreatedAt:       feed.CreatedAt,
        ExtraInfo:       extra,
    }

    logger.Debug().Str("campaign_address", campaignAddr).Int64("feed_id", feed.ID).Msg("Latest campaign feed retrieved successfully")
    c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Latest campaign feed retrieved", resp))
}

// ListCampaignFeedsByAddress godoc
// @Summary List all feeds of a campaign
// @Description List all donation campaign feeds by campaign address
// @Tags campaign_feed
// @Produce json
// @Param campaign_address path string true "Campaign address"
// @Success 200 {object} models.Response{data=[]models.DonationCampaignFeedResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/campaigns/list-feed/{campaign_address} [get]
func (h *DonationCampaignFeedHandler) ListCampaignFeedsByAddress(c *gin.Context) {
	campaignAddr := c.Param("campaign_address")
	if campaignAddr == "" {
		logger.Error().Msg("Missing campaign_address parameter")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing campaign_address"))
		return
	}

	feeds, err := h.repo.ListCampaignFeedsByAddress(campaignAddr)
	if err != nil {
		logger.Error().Err(err).Str("campaign_address", campaignAddr).Msg("Failed to list campaign feeds")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Internal server error"))
		return
	}
	if len(feeds) == 0 {
		logger.Warn().Str("campaign_address", campaignAddr).Msg("No feeds found for campaign")
		c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "No feeds found"))
		return
	}
    
	var resp []models.DonationCampaignFeedResponse
	for _, feed := range feeds {
		var extra models.FeedExtraInfo
		_ = json.Unmarshal(feed.ExtraInfo, &extra)
		resp = append(resp, models.DonationCampaignFeedResponse{
			ID:              feed.ID,
			TxHash:          feed.TxHash,
			OwnerAddress:    feed.OwnerAddress,
			CampaignAddress: feed.CampaignAddress,
			CreatedAt:       feed.CreatedAt,
			ExtraInfo:       extra,
		})
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Campaign feeds retrieved", resp))
}