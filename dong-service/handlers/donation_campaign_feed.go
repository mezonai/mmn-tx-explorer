package handlers

import (
    "dong-service/config"
    "dong-service/logger"
    "dong-service/middleware"
    "dong-service/models"
    "dong-service/repository"
    "dong-service/services"
    "encoding/json"
    "github.com/gin-gonic/gin"
    "io"
    "net/http"
    "bytes"    
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

// UploadImage godoc
// @Summary Upload images for a campaign
// @Description Upload images, scan for virus (if enabled), and store to IPFS
// @Tags campaign_feed
// @Accept multipart/form-data
// @Produce json
// @Param files formData file true "Images to upload"
// @Success 200 {object} models.Response{data=models.UploadImageResponse}
// @Failure 400 {object} models.Response
// @Failure 429 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/admin/campaigns/upload-image [post]
func (h *DonationCampaignFeedHandler) UploadImage(c *gin.Context) {
	// Rate limit middleware
	middleware.RateLimitMiddleware(h.cfg)(c)
	if c.IsAborted() {
		return
	}
	// Image filter middleware
	middleware.FilterImageMiddleware(h.cfg)(c)
	if c.IsAborted() {
		return
	}

	uploadedFiles, ok := c.Get("uploaded_files")
	if !ok {
		logger.Error().Msg("No uploaded files found in context")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "No files uploaded"))
		return
	}
	files := uploadedFiles.([]middleware.UploadedFile)

	images := make(map[string]io.Reader)
	for _, file := range files {
		images[file.NewName] = bytes.NewReader(file.Content)
	}

	ipfsSvc := services.IPFS
	if ipfsSvc == nil {
		logger.Error().Msg("IPFS service is not initialized")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "IPFS service is not initialized"))
		return
	}

	folderCID, fileCIDs, err := ipfsSvc.UploadImagesAsFolder(c.Request.Context(), images)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to upload images to IPFS")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to upload images as folder to IPFS: "+err.Error()))
		return
	}

	var results []models.UploadedImageInfo
	for filename := range images {
		results = append(results, models.UploadedImageInfo{
			FileName: filename,
			FileCID:  fileCIDs[filename],
		})
	}

	resp := models.UploadImageResponse{
		FolderCID: folderCID,
		Files:     results,
	}

	logger.Info().Str("folder_cid", folderCID).Interface("files", results).Msg("Images uploaded to IPFS successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Upload images successfully", resp))
}