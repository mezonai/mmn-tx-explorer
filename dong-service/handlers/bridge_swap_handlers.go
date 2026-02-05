package handlers

import (
	"dong-service/config"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BridgeSwapHandler struct {
	bridgeRepo    *repository.BridgeSwapRepository
	hotWalletRepo *repository.HotWalletSwapRepository
	cfg           *config.Config
}

func NewBridgeSwapHandler(
	bridgeRepo *repository.BridgeSwapRepository,
	hotWalletRepo *repository.HotWalletSwapRepository,
	cfg *config.Config,
) *BridgeSwapHandler {
	return &BridgeSwapHandler{
		bridgeRepo:    bridgeRepo,
		hotWalletRepo: hotWalletRepo,
		cfg:           cfg,
	}
}

// CreateSwapHistory godoc
// @Summary Create a swap history record
// @Description Log a swap transaction in the hot wallet history
// @Tags bridge_swap
// @Accept json
// @Produce json
// @Param history body models.CreateSwapHistoryRequest true "Swap History Data"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/bridge-swap/create-swap-history [post]
func (h *BridgeSwapHandler) CreateSwapHistory(c *gin.Context) {
	userId, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{Message: "Unauthorized: " + err.Error()})
		return
	}
	var req models.CreateSwapHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Message: "Invalid request: " + err.Error()})
		return
	}
	history := &models.HotWalletHistory{
		UserID:               userId,
		SendWalletAddress:    req.SendWalletAddress,
		ReceiveWalletAddress: req.ReceiveWalletAddress,
		TxHash:               req.TxHash,
		Amount:               req.Amount,
		Type:                 req.Type,
	}

	err = h.hotWalletRepo.CreateSwapHistory(c.Request.Context(), history)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Message: "Failed to create swap history: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, models.Response{Message: "Swap history created successfully"})
}
