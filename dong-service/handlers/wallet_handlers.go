package handlers

import (
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// WalletHandler handles HTTP requests for wallet operations
type WalletHandler struct {
	walletRepo   *repository.WalletRepository
	campaignRepo *repository.DonationCampaignRepository
}

// NewWalletHandler creates a new wallet handler
func NewWalletHandler(walletRepo *repository.WalletRepository, campaignRepo *repository.DonationCampaignRepository) *WalletHandler {
	return &WalletHandler{
		walletRepo:   walletRepo,
		campaignRepo: campaignRepo,
	}
}

// GetWalletDetail godoc
// @Summary Get wallet details
// @Description Get detailed information about a wallet by its address
// @Tags wallets
// @Produce json
// @Param address path string true "Wallet address"
// @Success 200 {object} models.Response{data=models.WalletDetailResponse}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/wallets/{address}/detail [get]
func (h *WalletHandler) GetWalletDetail(c *gin.Context) {
	userAddress, _ := utils.GetAddressFromContext(c)
	address := c.Param("address")
	if address == "" {
		logger.Error().Msg("Wallet address is required")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Wallet address is required"))
		return
	}

	logger.Debug().Str("address", address).Msg("Fetching wallet details")

	wallet, err := h.walletRepo.GetByAddress(address)
	if err != nil {
		logger.Error().Err(err).Str("address", address).Msg("Failed to get wallet details")
		if err.Error() == "wallet not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "Wallet not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to get wallet details: "+err.Error()))
		return
	}

	response := wallet.Serialize()

	// Show balance if it's the user's own wallet
	if userAddress == address {
		response.Balance = wallet.Balance
	} else {
		// Check if this is a campaign wallet
		isCampaignWallet, err := h.campaignRepo.IsCampaignWallet(address)
		if err != nil {
			logger.Error().Err(err).Str("address", address).Msg("Failed to check if wallet is campaign wallet")
			isCampaignWallet = false
		}

		if isCampaignWallet {
			response.Balance = wallet.Balance
		} else {
			response.Balance = ""
		}
	}

	logger.Debug().Str("address", address).Msg("Wallet details retrieved successfully")
	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Wallet details retrieved successfully", response))
}
