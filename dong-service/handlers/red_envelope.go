package handlers

import (
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type RedEnvelopeHandler struct {
	repo         *repository.RedEnvelopeRepository
	queueService *repository.RedEnvelopeQueueService
	redEnvelopeWalletRepo *repository.RedEnvelopeWalletRepository
}

func NewRedEnvelopeHandler(repo *repository.RedEnvelopeRepository, queueService *repository.RedEnvelopeQueueService, redEnvelopeWalletRepo *repository.RedEnvelopeWalletRepository) *RedEnvelopeHandler {
	return &RedEnvelopeHandler{
		repo:         repo,
		queueService: queueService,
		redEnvelopeWalletRepo: redEnvelopeWalletRepo,
	}
}

// CreateRedEnvelope godoc
// @Summary Create a new red envelope session
// @Description Create a new red envelope session with specified parameters
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param red_envelope body models.CreateRedEnvelopeRequest true "Red Envelope Creation Request"
// @Success 201 {object} models.Response{data=models.RedEnvelope}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/red_envelopes/create [post]
func (h *RedEnvelopeHandler) CreateRedEnvelope(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized red envelope creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	var req models.CreateRedEnvelopeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Invalid red envelope creation request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}
	logger.Info().Int64("user_id", userID).Str("name", req.Name).Msg("Creating new red envelope")

	envelope, err := h.repo.Create(&req, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Failed to create red envelope")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to create red envelope: "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Str("envelope_id", envelope.ID).Str("name", envelope.Name).Msg("Red envelope created successfully")
	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage("Red envelope created successfully", envelope))
}

// GetRedEnvelope godoc
// @Summary Get red envelope by ID
// @Description Retrieve details of a red envelope session by its ID
// @Tags red_envelopes
// @Produce json
// @Param id path int true "Red Envelope ID"
// @Success 200 {object} models.Response{data=models.RedEnvelope}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red_envelopes/:id [get]
func (h *RedEnvelopeHandler) GetRedEnvelopeClaim(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing red envelope ID"))
		return
	}

	envelop, err := h.repo.GetRedEnvelopeClaimById(id)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope")
		c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "Red envelope not found"))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(envelop))
}

// GetRedEnvelopeStats godoc
// @Summary Get red envelope statistics
// @Description Get overall statistics for red envelope sessions
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=object}
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/stats [get]
func (h *RedEnvelopeHandler) GetRedEnvelopeStats(c *gin.Context) {
	wallet_address := ""
	if p := c.Query("wallet_address"); p != "" {
		if val := p; val != "" {
			wallet_address = val
		}
	}
	stats, err := h.repo.GetStats(wallet_address)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get red envelope stats")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(stats))
}

// GetRedEnvelopeClaimByWallet godoc
// @Summary Get red envelope claims by wallet address
// @Description Retrieve red envelope claims associated with a specific wallet address
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param request body object{wallet_address=string} true "Wallet Address Request"
// @Success 200 {object} models.Response{data=[]models.RedEnvelopeClaim}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/claimed-by-wallet [get]
func (h *RedEnvelopeHandler) GetRedEnvelopeClaimByWallet(c *gin.Context) {
	page := 1
	limit := 10
	wallet_address := ""
	if p := c.Query("wallet_address"); p != "" {
		if val := p; val != "" {
			wallet_address = val
		}
	}
	if p := c.Query("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil && val > 0 {
			page = val
		}
	}
	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	claims, err := h.repo.GetRedEnvelopeClaimByWallet(wallet_address, page, limit)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get red envelope claims")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
		return
	}
	count, err := h.repo.GetCountClaimedAmount(wallet_address)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get count of red envelope claims")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
		return
	}

	c.JSON(http.StatusOK, models.PaginatedSuccessResponse(constants.MsgRedEnvelopeStatsRetrieved, claims, page, limit, count))
}

// GetRedEnvelopeCreateByWallet godoc
// @Summary Get red envelopes created by wallet address
// @Description Retrieve red envelopes created by a specific wallet address
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param request body object{wallet_address=string} true "Wallet Address Request"
// @Success 200 {object} models.Response{data=[]models.RedEnvelope}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/created-by-wallet [get]
func (h *RedEnvelopeHandler) GetRedEnvelopeCreateByWallet(c *gin.Context) {
	page := 1
	limit := 10
	wallet_address := ""
	if p := c.Query("wallet_address"); p != "" {
		if val := p; val != "" {
			wallet_address = val
		}
	}
	if p := c.Query("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil && val > 0 {
			page = val
		}
	}
	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	creates, err := h.repo.GetRedEnvelopeCreateByWallet(wallet_address, page, limit)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get red envelope creates")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
		return
	}

	count, err := h.repo.GetCountCreatedEnvelope(wallet_address)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get count of red envelope claims")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
		return
	}
	c.JSON(http.StatusOK, models.PaginatedSuccessResponse(constants.MsgRedEnvelopeStatsRetrieved, creates, page, limit, count))
}

// UpdateStatusRedEnvelope godoc
// @Summary update status red envelope to published
// @Description update status red envelope to published
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param request body object{id=int64,status=int} true "Update Status Request"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/red-envelopes/update-status-red-envelope [post]
func (r *RedEnvelopeHandler) UpdateStatusRedEnvelope(c *gin.Context) {
	var req struct {
		ID     string `json:"id" binding:"required"`
		Status int    `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("Invalid update status request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}

	var status_red_envelope string
	switch req.Status {
	case constants.StatusFailed:
		status_red_envelope = constants.RedEnvelopeStatusFailed
	case constants.StatusExpired:
		status_red_envelope = constants.RedEnvelopeStatusExpired
	default:
		status_red_envelope = constants.RedEnvelopeStatusPublished
	}

	err := r.repo.UpdateStatus(c, req.ID, status_red_envelope)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.ID).Msg("Failed to update red envelope status")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to update red envelope status"))
		return
	}

	logger.Info().Str("envelope_id", req.ID).Str("new_status", status_red_envelope).Msg("Red envelope status updated successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Red envelope status updated successfully", map[string]interface{}{
		"id":     req.ID,
		"status": status_red_envelope,
	}))
}

// GetDetailRedEnvelopeById godoc
// @Summary get detail red envelope by id and wallet address
// @Description get detail red envelope by id and wallet address
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param request body object{id=int64,wallet_address=string} true "Get Detail Request"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/detail [post]
func (r *RedEnvelopeHandler) GetDetailRedEnvelopeById(c *gin.Context) {
	var req struct {
		ID            string `json:"id" binding:"required"`
		WalletAddress string `json:"wallet_address" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("Invalid get detail request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}

	result, err := r.repo.GetDetailRedEnvelopeById(req.ID, req.WalletAddress)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.ID)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to get detail red envelope"))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Red envelope detail retrieved successfully", result))
}

// CloseSessionRedEnvelope godoc
// @Summary close red envelope session
// @Description close red envelope session
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param request body object{id=int64,wallet_address=string} true "Get Detail Request"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/close-session [post]
func (r *RedEnvelopeHandler) CloseSessionRedEnvelope(c *gin.Context) {
	var req struct {
		ID            string `json:"id" binding:"required"`
		WalletAddress string `json:"wallet_address" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("Invalid close session request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}
	err := r.repo.CloseSession(req.ID, req.WalletAddress)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.ID)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to close red envelope session"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Red envelope session closed successfully", nil))
}
