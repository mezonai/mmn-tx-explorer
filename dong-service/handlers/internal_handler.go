package handlers

import (
	"net/http"

	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct {
	feedRepo  *repository.DonationCampaignFeedRepository
	offerRepo *repository.OfferRepository
}

func NewInternalHandler(
	feedRepo *repository.DonationCampaignFeedRepository,
	offerRepo *repository.OfferRepository,
) *InternalHandler {
	return &InternalHandler{
		feedRepo:  feedRepo,
		offerRepo: offerRepo,
	}
}

// InsertUserContents inserts batch of user content
func (h *InternalHandler) InsertUserContents(c *gin.Context) {
	var items []models.DonationCampaignFeed
	if err := c.ShouldBindJSON(&items); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	if err := h.feedRepo.InsertUserContents(c.Request.Context(), items); err != nil {
		logger.Error().Err(err).Msg("Failed to insert user contents")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// UpdateOfferStatus handles batch offer status validation and update
func (h *InternalHandler) UpdateOfferStatus(c *gin.Context) {
	var req models.BatchUpdateOfferStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	if err := h.offerRepo.BatchUpdateOfferStatus(c.Request.Context(), req.Transactions, req.OfferIDMap); err != nil {
		logger.Error().Err(err).Msg("Failed to update offer status")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
