package handlers

import (
	"math/big"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/api"
	"github.com/thirdweb-dev/indexer/internal/storage"
	pb "github.com/thirdweb-dev/indexer/proto"
	"context"
)

// StatsResponse represents the response structure for blockchain statistics
type StatsResponse struct {
	Data struct {
		TotalBlocks      uint64  `json:"total_blocks"`
		TotalTransactions uint64  `json:"total_transactions"`
		TotalPendingTransactions uint64  `json:"total_pending_transactions"`
		AverageBlockTime  float64 `json:"average_block_time"`
		TotalWallets     uint64  `json:"total_wallets"`
		Transactions24h   uint64  `json:"transactions_24h"`
		PendingTransactions30m   uint64  `json:"pending_transactions_30m"`
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

	// Get pending transactions count
	pendingTxsData, err := mainStorage.GetPendingTransactions(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error getting pending transactions")
		api.InternalErrorHandler(c)
		return
	}

	totalPendingTransactions := pendingTxsData.TotalCount
	pendingTransactions30m := CountPendingTxLast30m(pendingTxsData.PendingTxs)

	// Get total transactions count
	totalTransactions, err := mainStorage.GetCount("transactions", countQf)
	if err != nil {
		log.Error().Err(err).Msg("Error getting transactions count")
		api.InternalErrorHandler(c)
		return
	}
	totalTransactions+=totalPendingTransactions
	
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

	transactions24h+=totalPendingTransactions


	// Compute average block time using last N blocks
	const numberOfBlocks uint64 = 100
	averageBlockTime := getAverageBlockTime(mainStorage, numberOfBlocks)

	// Initialize the StatsResponse
	statsResponse := StatsResponse{
		Data: struct {
			TotalBlocks      uint64  `json:"total_blocks"`
			TotalTransactions uint64  `json:"total_transactions"`
			TotalPendingTransactions uint64  `json:"total_pending_transactions"`
			AverageBlockTime  float64 `json:"average_block_time"`
			TotalWallets     uint64  `json:"total_wallets"`
			Transactions24h   uint64  `json:"transactions_24h"`
			PendingTransactions30m   uint64  `json:"pending_transactions_30m"`
		}{
			TotalBlocks:      totalBlocks,
			TotalTransactions: totalTransactions,
			TotalPendingTransactions: totalPendingTransactions,
			AverageBlockTime:  averageBlockTime,
			TotalWallets:     totalWallets,
			Transactions24h:   transactions24h,
			PendingTransactions30m:   pendingTransactions30m,
		},
	}

	c.JSON(http.StatusOK, statsResponse)
}

func CountPendingTxLast30m(pendingTxs []*pb.TransactionData) uint64 {
    now := uint64(time.Now().Unix())
    thirtyMinutesAgo := now - 1800

    count := 0
    for _, tx := range pendingTxs {
        if tx != nil && tx.Timestamp >= thirtyMinutesAgo {
            count++
        }
    }
    return uint64(count)
}
func getAverageBlockTime(mainStorage storage.IMainStorage, numberOfBlocks uint64) float64 {
	latestQf := storage.QueryFilter{
		SortBy:              "block_number",
		SortOrder:           "desc",
		Limit:               1,
		ForceConsistentData: true,
	}
	latestBlocks, err := mainStorage.GetBlocks(latestQf)
	if err == nil && len(latestBlocks.Data) > 0 {
		latest := latestBlocks.Data[0]
		latestTimestamp := latest.Timestamp.Unix()
		latestBlockNumber := latest.Number.Uint64()
		k := numberOfBlocks
		if latestBlockNumber == 0 {
			k = 0
		} else if latestBlockNumber < numberOfBlocks {
			k = latestBlockNumber
		}
		if k > 0 {
			targetNum := int64(latestBlockNumber) - int64(k)
			targetQf := storage.QueryFilter{
				BlockNumbers:        []*big.Int{big.NewInt(targetNum)},
				ForceConsistentData: true,
			}
			targetBlocks, err2 := mainStorage.GetBlocks(targetQf)
			if err2 == nil && len(targetBlocks.Data) > 0 {
				timestampMinusK := targetBlocks.Data[0].Timestamp.Unix()
				avg := float64(latestTimestamp-timestampMinusK) / float64(k)
				if avg > 0 {
					return float64(avg)
				}
			}
		}
	}
	return 0
}