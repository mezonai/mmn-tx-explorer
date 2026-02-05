package handlers

import (
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetHotWalletInfo(hotWalletRepo *repository.HotWalletSwapRepository, walletRepo *repository.WalletRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, err := utils.GetUserIDFromContext(c)
		if err != nil {
			logger.Error().Err(err).Msg("Unauthorized hot wallet info request")
			c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
			return
		}

		ctx := c.Request.Context()
		hotWallet, err := hotWalletRepo.GetHotWalletSwap(ctx)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to get hot wallet info")
			c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to get hot wallet info"))
			return
		}

		// Get wallet balance from indexer (if available)
		walletInfo, err := walletRepo.GetByAddress(hotWallet.WalletAddress)

		var balance int64

		if err != nil {
			// Wallet not found in indexer yet - return 0 balance
			logger.Warn().Err(err).Str("wallet", hotWallet.WalletAddress).Msg("Hot wallet not found in indexer")
			balance = 0
		} else {
			// Wallet found - parse balance
			if walletInfo.Balance != "" {
				if _, err := fmt.Sscanf(walletInfo.Balance, "%d", &balance); err != nil {
					logger.Warn().Err(err).Str("balance", walletInfo.Balance).Msg("Failed to parse balance, defaulting to 0")
					balance = 0
				}
			} else {
				balance = 0
			}
		}

		info := models.HotWalletInfo{
			WalletAddress: hotWallet.WalletAddress,
			Type:          "SWAP",
			Balance:       balance,
		}

		c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Hot wallet info retrieved", info))
	}
}
