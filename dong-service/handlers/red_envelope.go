package handlers

import (
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type RedEnvelopeHandler struct {
	repo         *repository.RedEnvelopeRepository
	walletRepo   *repository.IntermediaryWalletRepository
	queueService *repository.RedEnvelopeQueueService
}

func NewRedEnvelopeHandler(repo *repository.RedEnvelopeRepository, queueService *repository.RedEnvelopeQueueService, walletRepo *repository.IntermediaryWalletRepository) *RedEnvelopeHandler {
	return &RedEnvelopeHandler{
		repo:         repo,
		queueService: queueService,
		walletRepo:   walletRepo,
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
func (r *RedEnvelopeHandler) CreateRedEnvelope(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized red envelope creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	var req models.CreateRedEnvelopeRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Invalid red envelope creation request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody))
		return
	}

	if err = ValidateRequest(&req); err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Validation failed")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	envelope, err := r.repo.Create(&req, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Failed to create red envelope")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToCreatedRedEnvelope))
		return
	}

	logger.Info().Int64("user_id", userID).Str("envelope_id", envelope.ID).Str("name", envelope.Name).Msg("Red envelope created successfully")
	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeCreated, envelope))
}

// GetRecipientsByRedEnvelopeID godoc
// @Summary Get Recipients by red envelope id
// @Description Returns a list of users who have received red envelope
// @Tags red_envelopes
// @Produce json
// @Param id path int true "Red Envelope ID"
// @Success 200 {object} models.Response{data=models.RedEnvelope}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red_envelopes/:id/recipients [get]
func (r *RedEnvelopeHandler) GetRecipientsByRedEnvelopeID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		logger.Error().Msg("Missing red envelope ID")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrMissingRedEnvelopeID))
		return
	}

	if ok := r.verifyRedEnvelopeOwner(c, id); !ok {
		return
	}

	envelop, err := r.repo.GetRecipientsByRedEnvelopeID(id)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope")
		c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, constants.ErrFailedToGetRedEnvelope))
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
// @Failure 400 {object} models.Response
// @Router /api/v1/red-envelopes/stats [get]
func (r *RedEnvelopeHandler) GetRedEnvelopeStats(c *gin.Context) {
	stats, err := r.repo.GetStats()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get red envelope stats")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelopeStats))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(stats))
}

// GetRedEnvelopeStatsByUser godoc
// @Summary Get red envelope statistics by user
// @Description Get overall statistics for red envelope sessions by user
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Router /api/v1/red-envelopes/stats-by-user [get]
func (r *RedEnvelopeHandler) GetRedEnvelopeStatsByUser(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized red envelope creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	stats, err := r.repo.GetStatsByUser(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get red envelope stats")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelopeStats))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(stats))
}

// GetRedEnvelopeClaimedByUser godoc
// @Summary Get red envelope claimed by user
// @Description Retrieve red envelope claimed associated with a specific user
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=[]models.RedEnvelopeClaim}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/claimed-by-user [get]
func (r *RedEnvelopeHandler) GetRedEnvelopeClaimedByUser(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized red envelope creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	page := 1
	limit := 10
	var val int
	if val, err = strconv.Atoi(c.Query("page")); err == nil && val > 0 {
		page = val
	}

	if val, err = strconv.Atoi(c.Query("limit")); err == nil && val > 0 {
		limit = val
	}

	claims, err := r.repo.GetRedEnvelopeClaimedByUser(userID, page, limit)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get red envelope claims")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelopes))
		return
	}
	count, err := r.repo.GetCountClaimedAmount(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get count of red envelope claims")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToCountRedEnvelopes))
		return
	}

	c.JSON(http.StatusOK, models.PaginatedSuccessResponse(constants.MsgRedEnvelopeStatsRetrieved, claims, page, limit, count))
}

// GetRedEnvelopeCreatedByUser godoc
// @Summary Get red envelopes created by user
// @Description Retrieve red envelopes created by a specific user
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=[]models.RedEnvelope}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/created-by-user [get]
func (r *RedEnvelopeHandler) GetRedEnvelopeCreatedByUser(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized red envelope creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}
	page := 1
	limit := 10
	var val int
	if val, err = strconv.Atoi(c.Query("page")); err == nil && val > 0 {
		page = val
	}

	if val, err = strconv.Atoi(c.Query("limit")); err == nil && val > 0 {
		limit = val
	}

	creates, err := r.repo.GetRedEnvelopeCreatedByUser(userID, page, limit)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to retrieve created red envelopes")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelopes))
		return
	}

	count, err := r.repo.GetCountCreatedEnvelope(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get count of red envelope creations")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToCountRedEnvelopes))
		return
	}
	c.JSON(http.StatusOK, models.PaginatedSuccessResponse(constants.MsgRedEnvelopeStatsRetrieved, creates, page, limit, count))
}

// UpdateStatusRedEnvelope godoc
// @Summary update status red envelope
// @Description update status red envelope to published or failed
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
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody))
		return
	}

	if ok := r.verifyRedEnvelopeOwner(c, req.ID); !ok {
		return
	}

	var statusRedEnvelope string
	switch req.Status {
	case constants.StatusFailed:
		statusRedEnvelope = constants.RedEnvelopeStatusFailed
	case constants.StatusExpired:
		statusRedEnvelope = constants.RedEnvelopeStatusExpired
	default:
		statusRedEnvelope = constants.RedEnvelopeStatusPublished
	}

	err := r.repo.UpdateStatus(c, req.ID, statusRedEnvelope, nil)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.ID).Msg("Failed to update red envelope status")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToUpdateRedEnvelopeStatus))
		return
	}

	logger.Info().Str("envelope_id", req.ID).Str("new_status", statusRedEnvelope).Msg("Red envelope status updated successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeUpdated, map[string]interface{}{
		"id":     req.ID,
		"status": statusRedEnvelope,
	}))
}

// GetDetailRedEnvelopeByID godoc
// @Summary get detail red envelope by id
// @Description get detail red envelope by id
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param id path int true "Red Envelope ID"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/detail/:id [get]
func (r *RedEnvelopeHandler) GetDetailRedEnvelopeByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		logger.Error().Msg("Missing red envelope ID")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrMissingRedEnvelopeID))
		return
	}

	if ok := r.verifyRedEnvelopeOwner(c, id); !ok {
		return
	}

	var result models.DetailRedEnvelope
	result, err := r.repo.GetDetailRedEnvelopeByID(id)

	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope info")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelopeInfo))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeRetrieved, result))
}

// CloseSessionRedEnvelope godoc
// @Summary close red envelope session
// @Description close red envelope session
// @Tags red_envelopes
// @Accept json
// @Produce json
// @Param request body object{id=int64} true "Close Session Request"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/close-session [post]
func (r *RedEnvelopeHandler) CloseSessionRedEnvelope(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized red envelope creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	var req struct {
		ID string `json:"id" binding:"required"`
	}

	if err = c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("Invalid close session request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody))
		return
	}

	err = r.repo.CloseSession(req.ID, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.ID).Int64("user_id", userID).Msg("Failed to close red envelope session")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToCloseRedEnvelope))
		return
	}
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeClosed, nil))
}

// ClaimAmountRedEnvelope godoc
// @Summary Claim red envelope
// @Description User claims a red envelope and receives money
// @Tags red_envelopes
// @Produce json
// @Query id path string true "Red Envelope ID"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red_envelopes/claim-amount [get]
func (r *RedEnvelopeHandler) ClaimAmountRedEnvelope(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized claim amount attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id := c.Query("id")
	if validateClaimRedEnvelope := r.validateClaimRedEnvelope(c, id, userID); !validateClaimRedEnvelope {
		return
	}

	amount, err := r.queueService.AttemptClaim(id, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Error during queue check")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	var description string
	description, err = r.queueService.GetDescription(id)
	if err != nil {
		logger.Warn().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope description from cache")
	}

	if description == "" {
		description, err = r.repo.GetRedEnvelopeDescriptionByID(id)
		if err != nil {
			logger.Error().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope description")
			c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelope))
			return
		}
	}

	result := map[string]interface{}{
		"amount":      amount,
		"description": description,
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeAmountClaimed, result))
}

// ClaimRedEnvelope godoc
// @Summary Claim red envelope
// @Description User claims a red envelope and receives money
// @Tags red_envelopes
// @Produce json
// @Param id path string true "Red Envelope ID"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/:id/claim [post]
func (r *RedEnvelopeHandler) ClaimRedEnvelope(c *gin.Context) {
	envelopeID := c.Param("id")

	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized claim amount attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	if validateClaimRedEnvelope := r.validateClaimRedEnvelope(c, envelopeID, userID); !validateClaimRedEnvelope {
		return
	}

	amount, err := r.queueService.VerifyReservation(c, envelopeID, userID)
	if err != nil {
		logger.Error().Err(err).Msg("Reservation verification failed")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Users are not allowed to receive lucky money."))
		return
	}

	userAddress := utils.GenerateAddress(strconv.FormatInt(userID, 10))
	err = r.repo.ExecuteClaim(envelopeID, userAddress, userID, int64(amount))

	if err != nil {
		logger.Error().Err(err).Str("envelope_id", envelopeID).Msg("Failed to execute claim")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToClaim))
		return
	}

	logger.Info().
		Str("envelope_id", envelopeID).
		Str("wallet", userAddress).
		Int64("user_id", userID).
		Msg("Red envelope claimed successfully")

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeClaimed, nil))
}

// ClaimAmountRedEnvelopeQR godoc
// @Summary Claim red envelope amount via QR (ZK authentication)
// @Description Get claim amount for red envelope using ZK proof authentication
// @Tags red_envelopes
// @Produce json
// @Param id query string true "Red Envelope ID"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/qr/:id/claim-amount [post]
func (r *RedEnvelopeHandler) ClaimAmountRedEnvelopeQR(c *gin.Context) {
	userID, err := utils.GetZKUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get user ID from context")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id := c.Query("id")
	if validateClaimRedEnvelope := r.validateClaimRedEnvelope(c, id, userID); !validateClaimRedEnvelope {
		return
	}

	amount, err := r.queueService.AttemptClaim(id, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Error during queue check")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	var description string
	description, err = r.queueService.GetDescription(id)
	if err != nil {
		logger.Warn().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope description from cache")
	}

	if description == "" {
		description, err = r.repo.GetRedEnvelopeDescriptionByID(id)
		if err != nil {
			logger.Error().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope description")
			c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelope))
			return
		}
	}

	logger.Info().
		Str("envelope_id", id).
		Int64("user_id", userID).
		Msg("User entered queue and received claim token via QR")

	result := map[string]interface{}{
		"amount":      amount,
		"description": description,
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeAmountClaimed, result))
}

// ClaimAmountRedEnvelopeQR_Legacy godoc
// @Summary Claim red envelope amount via QR (ZK authentication)
// @Description Get claim amount for red envelope using ZK proof authentication
// @Tags red_envelopes
// @Produce json
// @Param id query string true "Red Envelope ID"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/qr/claim-amount [post]
func (r *RedEnvelopeHandler) ClaimAmountRedEnvelopeQRLegacy(c *gin.Context) {
	userID, err := utils.GetZKUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get user ID from context")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	id := c.Query("id")
	if validateClaimRedEnvelope := r.validateClaimRedEnvelope(c, id, userID); !validateClaimRedEnvelope {
		return
	}

	amount, err := r.queueService.AttemptClaim(id, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Error during queue check")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	var description string
	description, err = r.queueService.GetDescription(id)
	if err != nil {
		logger.Warn().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope description from cache")
	}

	if description == "" {
		description, err = r.repo.GetRedEnvelopeDescriptionByID(id)
		if err != nil {
			logger.Error().Err(err).Str("envelope_id", id).Msg("Failed to get red envelope description")
			c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToGetRedEnvelope))
			return
		}
	}

	logger.Info().
		Str("envelope_id", id).
		Int64("user_id", userID).
		Msg("User entered queue and received claim token via QR")

	result := map[string]interface{}{
		"split_money_id": 3,
		"amount":         amount,
		"description":    description,
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeAmountClaimed, result))
}

// ClaimRedEnvelopeQR godoc
// @Summary Claim red envelope via QR (ZK authentication)
// @Description Claim red envelope and receive money using ZK proof authentication
// @Tags red_envelopes
// @Produce json
// @Param id path string true "Red Envelope ID"
// @Param id path string true "Red Envelope ID"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/qr/{id}/claim [post]
func (r *RedEnvelopeHandler) ClaimRedEnvelopeQR(c *gin.Context) {
	envelopeID := c.Param("id")

	userID, err := utils.GetZKUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get user ID from context")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	if validateClaimRedEnvelope := r.validateClaimRedEnvelope(c, envelopeID, userID); !validateClaimRedEnvelope {
		return
	}

	amount, err := r.queueService.VerifyReservation(c, envelopeID, userID)
	if err != nil {
		logger.Error().Err(err).Msg("Reservation verification failed")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Users are not allowed to receive lucky money."))
		return
	}

	userAddress := utils.GenerateAddress(strconv.FormatInt(userID, 10))
	err = r.repo.ExecuteClaim(envelopeID, userAddress, userID, int64(amount))

	if err != nil {
		logger.Error().Err(err).Str("envelope_id", envelopeID).Msg("Failed to execute claim")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToClaim))
		return
	}

	logger.Info().
		Str("envelope_id", envelopeID).
		Str("wallet", userAddress).
		Int64("user_id", userID).
		Msg("Red envelope claimed successfully via QR")

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeClaimed, nil))
}

// ClaimRedEnvelopeQR godoc
// @Summary Claim red envelope via QR (ZK authentication)
// @Description Claim red envelope and receive money using ZK proof authentication
// @Tags red_envelopes
// @Produce json
// @Param id path string true "Red Envelope ID"
// @Param claim body models.ClaimRedEnvelopeRequest true "ClaimRedEnvelopeRequest"
// @Success 200 {object} models.Response{data=object}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red-envelopes/qr/{id}/claim [post]
func (r *RedEnvelopeHandler) ClaimRedEnvelopeQRLegacy(c *gin.Context) {
	var req models.ClaimRedEnvelopeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("Invalid claim request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}

	envelopeID := c.Param("id")

	userID, err := utils.GetZKUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get user ID from context")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	if validateClaimRedEnvelope := r.validateClaimRedEnvelope(c, envelopeID, userID); !validateClaimRedEnvelope {
		return
	}

	amount, err := r.queueService.VerifyReservation(c, envelopeID, userID)
	if err != nil {
		logger.Error().Err(err).Msg("Reservation verification failed")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Users are not allowed to receive lucky money."))
		return
	}

	userAddress := utils.GenerateAddress(strconv.FormatInt(userID, 10))
	err = r.repo.ExecuteClaim(envelopeID, userAddress, userID, int64(amount))

	if err != nil {
		logger.Error().Err(err).Str("envelope_id", envelopeID).Msg("Failed to execute claim")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToClaim))
		return
	}

	logger.Info().
		Str("envelope_id", envelopeID).
		Str("wallet", userAddress).
		Int64("user_id", userID).
		Msg("Red envelope claimed successfully via QR")

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage(constants.MsgRedEnvelopeClaimed, nil))
}
func ValidateRequest(req *models.CreateRedEnvelopeRequest) error {
	if req.TotalAmount < req.TotalClaims {
		return fmt.Errorf("totalAmount (%d) must be at least equal to totalClaims (%d)", req.TotalAmount, req.TotalClaims)
	}

	if req.TotalClaims > constants.MaxPaticipantCount {
		return fmt.Errorf("totalClaims (%d) must not exceed (%d)", req.TotalClaims, constants.MaxPaticipantCount)
	}

	if req.IsRandomDistribution {
		if *req.MinAmount > *req.MaxAmount {
			return fmt.Errorf("minAmount (%d) don't exceed maxAmount (%d)", *req.MinAmount, *req.MaxAmount)
		}

		if req.TotalAmount < req.TotalClaims**req.MinAmount {
			return fmt.Errorf("totalAmount (%d) not enough to divide at least %d by %d people", req.TotalAmount, *req.MinAmount, req.TotalClaims)
		}

		if req.TotalAmount > req.TotalClaims**req.MaxAmount {
			return fmt.Errorf("totalAmount (%d) exceeds maximum distributable amount (%d * %d = %d)", req.TotalAmount, req.TotalClaims, *req.MaxAmount, req.TotalClaims**req.MaxAmount)
		}
	}

	return nil
}

func (r *RedEnvelopeHandler) verifyRedEnvelopeOwner(c *gin.Context, redEnvelopeID string) bool {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return false
	}

	isOwner, err := r.repo.CheckUserIDAndEnvelopeID(redEnvelopeID, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", redEnvelopeID).Int64("user_id", userID).Msg("Failed to check ownership")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrUserIDNotMatchRedEnvelopeID))
		return false
	}

	if !isOwner {
		logger.Warn().Str("envelope_id", redEnvelopeID).Int64("user_id", userID).Msg("User is not the owner")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrUserIDNotMatchRedEnvelopeID))
		return false
	}

	return true
}

func (r *RedEnvelopeHandler) validateClaimRedEnvelope(c *gin.Context, id string, userID int64) bool {
	canClaim, err := r.repo.HasUserClaimed(id, userID)

	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", id).
			Int64("user_id", userID).
			Msg("Failed to check user id and envelope id")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailedToCheckRedEnvelope))
		return false
	}

	if !canClaim {
		logger.Error().
			Str("red_envelope_id", id).
			Int64("user_id", userID).
			Msg("User has already claimed from this red envelope")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "User has already claimed from this red envelope"))
		return false
	}
	return true
}
