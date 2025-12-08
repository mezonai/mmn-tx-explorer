package handlers

import (
	"database/sql"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type IntermediaryWalletHandler struct {
	repo *repository.IntermediaryWalletRepository
}

func NewIntermediaryWalletHandler(repo *repository.IntermediaryWalletRepository) *IntermediaryWalletHandler {
	return &IntermediaryWalletHandler{repo: repo}
}

// GetIntermediaryWalletByID godoc
// @Summary Get intermediary wallet
// @Description Get intermediary wallet information by internal ID
// @Tags intermediary-wallets
// @Produce json
// @Param id path int true "Wallet ID"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/intermediary-wallets/{id} [get]
func (h *IntermediaryWalletHandler) GetIntermediaryWalletByID(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "wallet id is required"))
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid wallet id"))
		return
	}

	w, err := h.repo.GetWalletByID(c.Request.Context(), id)
	if err != nil {
		logger.Error().Err(err).Int64("id", id).Msg("failed to get intermediary wallet by id")
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "wallet not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to get intermediary wallet: "+err.Error()))
		return
	}

	// Return the wallet object — encrypted private key is omitted in JSON via struct tag
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Intermediary wallet retrieved", w))
}
