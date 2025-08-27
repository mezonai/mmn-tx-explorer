package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/api"
	"github.com/thirdweb-dev/indexer/internal/storage"
)

// StatsResponse represents the response structure for blockchain statistics
type StatsResponse struct {
	Data struct {
		TotalBlocks      uint64  `json:"total_blocks"`
		TotalTransactions uint64  `json:"total_transactions"`
		TotalPendingTransactions uint64  `json:"total_pending_transactions"`
		AverageBlockTime  uint64 `json:"average_block_time"`
		TotalWallets     uint64  `json:"total_wallets"`
		Transactions24h   uint64  `json:"transactions_24h"`
		Transactions30m   uint64  `json:"transactions_30m"`
		PendingTransactions24h uint64  `json:"pending_transactions_24h"`
	} `json:"data"`
}

// @Summary Get blockchain statistics
// @Description Retrieve comprehensive blockchain statistics including total blocks, transactions, average block time, and wallets
// @Tags stats
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Success 200 {object} StatsResponse
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/stats [get]
func GetStats(c *gin.Context) {
	handleStatsRequest(c)
}

func handleStatsRequest(c *gin.Context) {

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	// Prepare QueryFilter for counts
	countQf := storage.QueryFilter{
		ForceConsistentData: true,
	}

	// Get total blocks count
	totalBlocks, err := mainStorage.GetCount("blocks", countQf)
	if err != nil {
		log.Error().Err(err).Msg("Error getting blocks count")
		api.InternalErrorHandler(c)
		return
	}

	// Get total transactions count
	totalTransactions, err := mainStorage.GetCount("transactions", countQf)
	if err != nil {
		log.Error().Err(err).Msg("Error getting transactions count")
		api.InternalErrorHandler(c)
		return
	}

	// Get total wallets count from wallet table
	totalWallets, err := mainStorage.GetCount("wallet", countQf)
	if err != nil {
		log.Error().Err(err).Msg("Error getting wallets count")
		api.InternalErrorHandler(c)
		return
	}

	// Calculate time ranges for recent transactions
	now := time.Now()
	time24hAgo := now.Add(-24 * time.Hour)
	time30mAgo := now.Add(-30 * time.Minute)

	// Prepare QueryFilter for time-based counts using FilterParams
	timeBasedQf24h := storage.QueryFilter{
		ForceConsistentData: true,
		FilterParams: map[string]string{
			"block_timestamp_gte": strconv.FormatInt(time24hAgo.Unix(), 10),
		},
	}

	// Get transactions count in last 24 hours
	transactions24h, err := mainStorage.GetCount("transactions", timeBasedQf24h)
	if err != nil {
		log.Error().Err(err).Msg("Error getting transactions count in last 24h")
		api.InternalErrorHandler(c)
		return
	}

	// Prepare QueryFilter for 30 minutes using FilterParams
	timeBasedQf30m := storage.QueryFilter{
		ForceConsistentData: true,
		FilterParams: map[string]string{
			"block_timestamp_gte": strconv.FormatInt(time30mAgo.Unix(), 10),
		},
	}

	// Get transactions count in last 30 minutes
	transactions30m, err := mainStorage.GetCount("transactions", timeBasedQf30m)
	if err != nil {
		log.Error().Err(err).Msg("Error getting transactions count in last 30m")
		api.InternalErrorHandler(c)
		return
	}

	// TODO: Get block time, pending transactions from the node
	averageBlockTime := uint64(200)
	totalPendingTransactions := uint64(0)
	pendingTransactions24h := uint64(0)
	// Initialize the StatsResponse
	statsResponse := StatsResponse{
		Data: struct {
			TotalBlocks      uint64  `json:"total_blocks"`
			TotalTransactions uint64  `json:"total_transactions"`
			TotalPendingTransactions uint64  `json:"total_pending_transactions"`
			AverageBlockTime  uint64 `json:"average_block_time"`
			TotalWallets     uint64  `json:"total_wallets"`
			Transactions24h   uint64  `json:"transactions_24h"`
			Transactions30m   uint64  `json:"transactions_30m"`
			PendingTransactions24h uint64  `json:"pending_transactions_24h"`
		}{
			TotalBlocks:      totalBlocks,
			TotalTransactions: totalTransactions,
			TotalPendingTransactions: totalPendingTransactions,
			AverageBlockTime:  averageBlockTime,
			TotalWallets:     totalWallets,
			Transactions24h:   transactions24h,
			Transactions30m:   transactions30m,
			PendingTransactions24h: pendingTransactions24h,
		},
	}

	c.JSON(http.StatusOK, statsResponse)
}
