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
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}
	logger.Info().Int64("user_id", userID).Str("name", req.Name).Msg("Creating new red envelope")

	if err = ValidateRequest(&req); err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Validation failed")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	envelope, err := r.repo.Create(&req, userID)
	if err != nil {
		logger.Error().Err(err).Int64("user_id", userID).Msg("Failed to create red envelope")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to create red envelope: "+err.Error()))
		return
	}

	logger.Info().Int64("user_id", userID).Str("envelope_id", envelope.ID).Str("name", envelope.Name).Msg("Red envelope created successfully")
	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage("Red envelope created successfully", envelope))
}

// GetRedEnvelopeClaim godoc
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
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing red envelope ID"))
		return
	}

	if ok := r.verifyRedEnvelopeOwner(c, id); !ok {
		return
	}

	envelop, err := r.repo.GetRecipientsByRedEnvelopeID(id)
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
func (r *RedEnvelopeHandler) GetRedEnvelopeStats(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized red envelope creation attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	stats, err := r.repo.GetStats(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get red envelope stats")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
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
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
		return
	}
	count, err := r.repo.GetCountClaimedAmount(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get count of red envelope claims")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
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
		logger.Error().Err(err).Msg("Failed to get red envelope creates")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
		return
	}

	count, err := r.repo.GetCountCreatedEnvelope(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get count of red envelope claims")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, constants.ErrInternalServer))
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
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
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

	err := r.repo.UpdateStatus(c, req.ID, statusRedEnvelope)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.ID).Msg("Failed to update red envelope status")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to update red envelope status"))
		return
	}

	logger.Info().Str("envelope_id", req.ID).Str("new_status", statusRedEnvelope).Msg("Red envelope status updated successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Red envelope status updated successfully", map[string]interface{}{
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
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing red envelope ID"))
		return
	}

	if ok := r.verifyRedEnvelopeOwner(c, id); !ok {
		return
	}

	var result models.DetailRedEnvelope
	result, err := r.repo.GetDetailRedEnvelopeByID(id)

	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id)
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
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}

	err = r.repo.CloseSession(req.ID, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.ID)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to close red envelope session"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Red envelope session closed successfully", nil))
}

// ClaimAmountRedEnvelope godoc
// @Summary Claim red envelope
// @Description User claims a red envelope and receives money
// @Tags red_envelopes
// @Produce json
// @Param id path string true "Red Envelope ID"
// @Param claim body models.ClaimRedEnvelopeRequest true "Claim Request"
// @Success 200 {object} models.Response{data=models.ClaimRedEnvelopeResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red_envelopes/claim-amount [get]
func (h *RedEnvelopeHandler) ClaimAmountRedEnvelope(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized claim amount attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	walletAddress := c.Query("wallet_address")
	if walletAddress == "" {
		logger.Error().Msg("Missing wallet address")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "wallet_address is required"))
		return
	}

	id := c.Query("id")
	allowed, err := h.queueService.AttemptClaim(id, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Error during queue check")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, err.Error()))
		return
	}

	if allowed == 0 {
		c.JSON(http.StatusTooManyRequests, models.ErrorResponse(http.StatusTooManyRequests, "Red envelope claims limit reached"))
		return
	}

	splitMoney, err := h.repo.GetClaimAmount(id, walletAddress, allowed, userID)
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", id).Msg("Failed to get claim amount")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to get claim amount: "+err.Error()))
		return
	}

	logger.Info().
		Str("envelope_id", id).
		Str("wallet", walletAddress).
		Int64("user_id", userID).
		Msg("User entered queue and received claim token")

	result := map[string]interface{}{
		"split_money_id":     splitMoney.Id,
		"amount":             splitMoney.Amount,
		"description":        splitMoney.Description,
		"expires_in_seconds": 300,
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Claim token generated successfully. Please use this token to complete the claim within 5 minutes.", result))
}

// ClaimRedEnvelope godoc
// @Summary Claim red envelope
// @Description User claims a red envelope and receives money
// @Tags red_envelopes
// @Produce json
// @Param id path string true "Red Envelope ID"
// @Param claim body models.ClaimRedEnvelopeRequest true "Claim Request"
// @Success 200 {object} models.Response{data=models.ClaimRedEnvelopeResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/red_envelopes/{id}/claim [post]
func (h *RedEnvelopeHandler) ClaimRedEnvelope(c *gin.Context) {
	var req struct {
		Id            string `json:"id" binding:"required"`
		ClaimerWallet string `json:"claimer_wallet" binding:"required"`
		SplitMoneyId  int64  `json:"split_money_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("Invalid claim request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrInvalidRequestBody+": "+err.Error()))
		return
	}

	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized claim amount attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	canClaim, err := h.repo.CheckUserIDClaimNotMatch(req.Id, userID, req.SplitMoneyId)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", req.Id).
			Int64("user_id", userID).
			Msg("Failed to check user id and envelope id")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrFailToCheckRedEnvelope+": "+err.Error()))
		return
	}
	if !canClaim {
		logger.Error().
			Str("red_envelope_id", req.Id).
			Int64("user_id", userID).
			Msg("User id does not match owner of red envelope")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, constants.ErrUserIDNotMatchRedEnvelopeID))
		return
	}

	err = h.repo.ExecuteClaim(req.Id, req.ClaimerWallet, userID, req.SplitMoneyId)

	if err != nil {
		logger.Error().Err(err).Str("envelope_id", req.Id).Msg("Failed to execute claim")

		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to claim red envelope: "+err.Error()))
		return
	}

	logger.Info().
		Str("envelope_id", req.Id).
		Str("wallet", req.ClaimerWallet).
		Int64("user_id", userID).
		Msg("Red envelope claimed successfully")

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Red envelope claimed successfully", nil))
}

func ValidateRequest(req *models.CreateRedEnvelopeRequest) error {
	if *req.MinAmount > *req.MaxAmount {
		return fmt.Errorf("minAmount (%d) don't exceed maxAmount (%d)", *req.MinAmount, *req.MaxAmount)
	}

	if req.TotalAmount < req.TotalClaims**req.MinAmount {
		return fmt.Errorf("totalAmount (%d) not enough to divide at least %d by %d people", req.TotalAmount, *req.MinAmount, req.TotalClaims)
	}

	if req.TotalAmount > req.TotalClaims**req.MaxAmount {
		return fmt.Errorf("totalAmount (%d) exceeds maximum distributable amount (%d * %d = %d)", req.TotalAmount, req.TotalClaims, *req.MaxAmount, req.TotalClaims**req.MaxAmount)
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
