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
	if offer != nil && offer.IntermediaryWalletID != 0 {
		addr, err := h.offerService.GetIntermediaryWalletAddress(c.Request.Context(), offer.IntermediaryWalletID)
		if err != nil {
			// log and continue — frontend can still call GET /intermediary-wallets/:id as fallback
			logger.Error().Err(err).Int64("wallet_id", offer.IntermediaryWalletID).Msg("failed to fetch intermediary wallet address")
		} else {
			intermediaryAddr = addr
		}
	}

	// return composite response containing created offer and intermediary address if available
	resp := map[string]any{"offer": offer}
	if intermediaryAddr != "" {
		resp["intermediary_wallet_address"] = intermediaryAddr
	}

	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage("Offer created", resp))
}

// ConfirmOffer godoc
// @Summary Confirm offer (mark an offer as confirmed)
// @Description Mark an offer as CONFIRMED and write a CREATED_CONFIRMED history record
// @Tags offers
// @Accept json
// @Produce json
// @Param id path int true "Offer ID"
// @Param body body object false "optional payload: {execution_price, source, metadata}"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/offers/{id}/confirm [post]
func (h *OfferHandler) ConfirmOffer(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing offer id"))
		return
	}

	var body struct {
		ExecutionPrice *string `json:"execution_price,omitempty"`
		Source         *string `json:"source,omitempty"`
		Metadata       *string `json:"metadata,omitempty"`
	}
	_ = c.ShouldBindJSON(&body)

	offerID, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid offer id"))
		return
	}

	if err := h.offerService.ConfirmOffer(c.Request.Context(), offerID, body.ExecutionPrice, body.Source, body.Metadata); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to confirm offer: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Offer confirmed", nil))
}

// ListOffers godoc
// @Summary List offers
// @Description List offers with optional filters: min_price, max_price, status, symbol. Supports pagination query params page, limit, order, order_by.
// @Tags offers
// @Accept json
// @Produce json
// @Param min_price query string false "minimum price"
// @Param max_price query string false "maximum price"
// @Param status query string false "offer status"
// @Param symbol query string false "symbol"
// @Param page query int false "page"
// @Param limit query int false "limit"
// @Success 200 {object} models.Response{data=[]models.Offer}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/offers [get]
func (h *OfferHandler) ListOffers(c *gin.Context) {
	minPrice := c.Query("min_price")
	maxPrice := c.Query("max_price")
	rate := c.Query("rate")
	status := c.Query("status")
	symbol := c.Query("symbol")

	pg := utils.GetPaginationParams(c)
	pagination := map[string]any{
		"order_by": pg.OrderBy,
		"order":    pg.Order,
		"limit":    pg.Limit,
		"offset":   pg.Offset,
	}

	var minP *string
	var maxP *string
	var rateP *string
	var st *string
	var sym *string
	if minPrice != "" {
		minP = &minPrice
	}
	if maxPrice != "" {
		maxP = &maxPrice
	}
	if rate != "" {
		rateP = &rate
	}
	if status != "" {
		st = &status
	}
	if symbol != "" {
		sym = &symbol
	}

	offers, err := h.offerService.ListOffers(c.Request.Context(), minP, maxP, st, sym, rateP, pagination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to list offers: "+err.Error()))
		return
	}

	total, err := h.offerService.CountOffers(c.Request.Context(), minP, maxP, st, sym, rateP)
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
