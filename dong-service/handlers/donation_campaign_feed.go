package handlers

import (
	"bytes"
	"dong-service/config"
	"dong-service/logger"
	"dong-service/middleware"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/services"
	"dong-service/utils"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type DonationCampaignFeedHandler struct {
	repo *repository.DonationCampaignFeedRepository
	cfg  *config.Config
}

func NewDonationCampaignFeedHandler(repo *repository.DonationCampaignFeedRepository, cfg *config.Config) *DonationCampaignFeedHandler {
	return &DonationCampaignFeedHandler{repo: repo, cfg: cfg}
}

// ListCampaignFeedsByAddress godoc
// @Summary List all feeds of a campaign
// @Description List all donation campaign feeds by campaign address
// @Tags campaign_feed
// @Produce json
// @Param campaign_address path string true "Campaign address"
// @Success 200 {object} models.Response{data=[]models.DonationCampaignFeed}
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

	userAddress, _ := utils.GetAddressFromContext(c)

	// Query param
	limitStr := c.DefaultQuery("limit", "10")
	timestampLtStr := c.Query("timestamp_lt")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid limit"))
		return
	}
	if limit > 100 {
		limit = 100
	}

	var timestampLt time.Time
	var errTime error

	if timestampLtStr == "" {
		timestampLt = time.Now()
	} else {
		timestampLt, errTime = time.Parse(time.RFC3339Nano, timestampLtStr)
		if errTime != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid timestamp_lt"))
			return
		}
	}

	feeds, err := h.repo.ListCampaignFeedsByAddress(campaignAddr, limit, timestampLt, userAddress)
	if err != nil {
		logger.Error().Err(err).Str("campaign_address", campaignAddr).Msg("Failed to list campaign feeds")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Internal server error"))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Campaign feeds retrieved", feeds))
}

// UpdateVisibleFeed godoc
// @Summary Update visibility of a feed
// @Description Update visible/unvisible state of parent & child feed by its root hash
// @Tags campaign_feed
// @Produce json
// @Param root_feed_hash path string true "Feed hash"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/campaigns/update-visible-feed/{root_feed_hash} [patch]
func (h *DonationCampaignFeedHandler) UpdateVisibleFeed(c *gin.Context) {
	feedHash := c.Param("root_feed_hash")
	if feedHash == "" {
		logger.Error().Msg("Missing root_feed_hash parameter")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing root_feed_hash"))
		return
	}

	// Validate feed is existing
	feed, err := h.repo.FindCampaignFeedByHash(feedHash)
	if err != nil {
		logger.Error().Err(err).Str("root_feed_hash", feedHash).Msg("Failed to find campaign feed")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Internal server error"))
		return
	}
	if feed == nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "Donation campaign feed not found"))
		return
	}

	// Validate feed is the root feed
	if feed.ParentHash != nil || feed.RootHash != nil {
		logger.Error().Str("root_feed_hash", feedHash).Msg("Feed is not a root feed")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Donation campaign feed is not a root feed"))
		return
	}

	// Validate user is the creator of the feed
	userAddress, _ := utils.GetAddressFromContext(c)
	if feed.CreatorAddress != userAddress {
		logger.Error().Str("user_address", userAddress).Str("creator_address", feed.CreatorAddress).Msg("User is not the creator of the feed")
		c.JSON(http.StatusForbidden, models.ErrorResponse(http.StatusForbidden, "You are not the creator of this feed"))
		return
	}

	var req models.UpdateVisibleFeedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("Failed to bind update visible feed request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid request body"))
		return
	}

	err = h.repo.UpdateVisibleFeed(feedHash, &req)
	if err != nil {
		logger.Error().Err(err).Str("root_feed_hash", feedHash).Msg("Failed to update visible feed")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Internal server error"))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Updated visible feed successfully", nil))
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
