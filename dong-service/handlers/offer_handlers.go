package handlers

import (
	"database/sql"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/services"
	"dong-service/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type OfferHandler struct {
	offerService services.IOfferService
}

func NewOfferHandler(offerService services.IOfferService) *OfferHandler {
	return &OfferHandler{offerService: offerService}
}

// CreateOffer godoc
// @Summary Create a new offer
// @Description Create a new trading offer and record initial offer history
// @Tags offers
// @Accept json
// @Produce json
// @Param offer body models.CreateOfferRequest true "Create Offer"
// @Success 201 {object} models.Response{data=models.Offer}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/offers [post]
func (h *OfferHandler) CreateOffer(c *gin.Context) {
	// Require authenticated wallet address for creating offers
	creatorAddr, ok := utils.GetAddressFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "authentication required"))
		return
	}

	var req models.CreateOfferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("invalid create offer request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid request: "+err.Error()))
		return
	}

	offer, err := h.offerService.CreateOffer(c.Request.Context(), &req, creatorAddr)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create offer")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to create offer: "+err.Error()))
		return
	}

	// Also fetch intermediary wallet address (frontend needs it to fund the intermediary wallet)
	var intermediaryAddr string
	if offer != nil && offer.IntermediaryWalletAddress != nil {
		intermediaryAddr = *offer.IntermediaryWalletAddress
	}

	// return composite response containing created offer and intermediary address if available
	resp := map[string]any{"offer": offer}
	if intermediaryAddr != "" {
		resp["intermediary_wallet_address"] = intermediaryAddr
	}

	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage("Offer created", resp))
}

// ListOffers godoc
// @Summary List offers
// @Description List offers with amount range filters. Supports pagination query params page, limit, order, order_by.
// @Tags offers
// @Accept json
// @Produce json
// @Param from_amount query string false "minimum amount"
// @Param to_amount query string false "maximum amount"
// @Param page query int false "page"
// @Param limit query int false "limit"
// @Success 200 {object} models.Response{data=[]models.Offer}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/offers [get]
func (h *OfferHandler) ListOffers(c *gin.Context) {
	fromAmount := c.Query("from_amount")
	toAmount := c.Query("to_amount")

	pg := utils.GetPaginationParams(c)
	pagination := map[string]any{
		"order_by": pg.OrderBy,
		"order":    pg.Order,
		"limit":    pg.Limit,
		"offset":   pg.Offset,
	}

	var fromP *string
	var toP *string
	if fromAmount != "" {
		fromP = &fromAmount
	}
	if toAmount != "" {
		toP = &toAmount
	}

	offers, err := h.offerService.ListOffers(c.Request.Context(), fromP, toP, pagination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to list offers: "+err.Error()))
		return
	}

	total, err := h.offerService.CountOffers(c.Request.Context(), fromP, toP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to list offers: "+err.Error()))
		return
	}

	formattedOffers := make([]models.Offer, len(offers))
	for i, of := range offers {
		formattedOffers[i] = of
		if of.PriceRate != nil {
			s := *of.PriceRate
			s = strings.TrimRight(s, "0")
			s = strings.TrimRight(s, ".")
			if s == "" {
				s = "0"
			}
			formattedOffers[i].PriceRate = &s
		}
	}

	var totalPage int64
	if pg.Limit > 0 {
		// compute ceil(total / limit)
		totalPage = (total + int64(pg.Limit) - 1) / int64(pg.Limit)
	} else {
		totalPage = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Offers retrieved",
		"data":    formattedOffers,
		"meta": gin.H{
			"page":        pg.Page + 1,
			"limit":       pg.Limit,
			"total_items": total,
			"total_pages": totalPage,
		},
	})
}

// GetOfferDetail godoc
// @Summary Get offer detail
// @Description Get full offer details by id
// @Tags offers
// @Accept json
// @Produce json
// @Param id path int true "Offer ID"
// @Success 200 {object} models.Response{data=models.Offer}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/offers/{id} [get]
func (h *OfferHandler) GetOfferDetail(c *gin.Context) {
	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid id"))
		return
	}

	offer, err := h.offerService.GetOfferByID(c.Request.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "offer not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to fetch offer: "+err.Error()))
		return
	}

	// normalize price_rate for output
	if offer.PriceRate != nil {
		s := *offer.PriceRate
		s = strings.TrimRight(s, "0")
		s = strings.TrimRight(s, ".")
		if s == "" {
			s = "0"
		}
		offer.PriceRate = &s
	}

	c.JSON(http.StatusOK, models.SuccessResponse(offer))
}

// GetMyOffers godoc
// @Summary Get my offers
// @Description Get all offers created by the authenticated user's wallet address
// @Tags offers
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=[]models.Offer}
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/offers/me [get]
func (h *OfferHandler) GetMyOffers(c *gin.Context) {
	walletAddress, _ := utils.GetAddressFromContext(c)

	offers, err := h.offerService.GetOffersByWalletAddress(c.Request.Context(), walletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to list offers: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(offers))
}
