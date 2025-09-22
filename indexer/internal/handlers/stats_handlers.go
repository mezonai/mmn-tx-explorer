package handlers

import (
	"math/big"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/api"
	"github.com/thirdweb-dev/indexer/internal/storage"
	pb "github.com/thirdweb-dev/indexer/proto"
)

// StatsResponse represents the response structure for blockchain statistics
type StatsResponse struct {
	Data struct {
		TotalBlocks              uint64  `json:"total_blocks"`
		TotalTransactions        uint64  `json:"total_transactions"`
		TotalPendingTransactions uint64  `json:"total_pending_transactions"`
		AverageBlockTime         float64 `json:"average_block_time"`
		TotalWallets             uint64  `json:"total_wallets"`
		Transactions24h          uint64  `json:"transactions_24h"`
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

	chainId, err := api.GetChainId(c)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	// Prepare QueryFilter for counts (scoped by chainId)
	countQf := storage.QueryFilter{
		ForceConsistentData: true,
		ChainId:             chainId,
	}

	// Calculate time ranges for recent transactions
	now := time.Now()
	time24hAgo := now.Add(-24 * time.Hour)

	// Prepare QueryFilter for time-based counts using FilterParams (scoped by chainId)
	timeBasedQf24h := storage.QueryFilter{
		ForceConsistentData: true,
		ChainId:             chainId,
		FilterParams: map[string]string{
			"block_timestamp_gte": strconv.FormatInt(time24hAgo.Unix(), 10),
		},
	}

	// Execute independent queries in parallel
	var (
		totalBlocks       uint64
		totalTransactions uint64
		totalWallets      uint64
		transactions24h   uint64
		pendingTxsData    *pb.GetPendingTransactionsResponse
		averageBlockTime  float64

		errBlocks, errTxs, errWallets, errTxs24h, errPending error
	)

	var wg sync.WaitGroup
	wg.Add(5)

	// Get total blocks count
	go func() {
		defer wg.Done()
		var e error
		totalBlocks, e = mainStorage.GetCount("blocks", countQf)
		if e != nil {
			errBlocks = e
		}
	}()

	// Get total transactions count
	go func() {
		defer wg.Done()
		var e error
		totalTransactions, e = mainStorage.GetCount("transactions", countQf)
		if e != nil {
			errTxs = e
		}
	}()

	// Get total wallets count
	go func() {
		defer wg.Done()
		var e error
		totalWallets, e = mainStorage.GetCount("wallet", storage.QueryFilter{ForceConsistentData: true})
		if e != nil {
			errWallets = e
		}
	}()

	// Get transactions count in last 24 hours
	go func() {
		defer wg.Done()
		var e error
		transactions24h, e = mainStorage.GetCount("transactions", timeBasedQf24h)
		if e != nil {
			errTxs24h = e
		}
	}()

	// Get pending transactions data
	go func() {
		defer wg.Done()
		var e error
		pendingTxsData, e = mainStorage.GetPendingTransactions(c.Request.Context())
		if e != nil {
			errPending = e
		}
	}()

	wg.Wait()

	// Handle errors
	if errBlocks != nil || errTxs != nil || errWallets != nil || errTxs24h != nil || errPending != nil {
		log.Error().
			Err(errBlocks).
			Err(errTxs).
			Err(errWallets).
			Err(errTxs24h).
			Err(errPending).
			Msg("Error querying stats")
		api.InternalErrorHandler(c)
		return
	}

	// Pending tx derived stats
	totalPendingTransactions := uint64(0)
	pendingTransactions30m := uint64(0)
	if pendingTxsData != nil {
		totalPendingTransactions = pendingTxsData.TotalCount
		pendingTransactions30m = CountPendingTxLast30m(pendingTxsData.PendingTxs)
	}

	// Include pending counts in totals per current logic
	totalTransactions += totalPendingTransactions
	transactions24h += totalPendingTransactions

	// Compute average block time using last N blocks (scoped by chain)
	const numberOfBlocks uint64 = 100
	averageBlockTime = getAverageBlockTime(mainStorage, numberOfBlocks, chainId)

	// Initialize the StatsResponse
	statsResponse := StatsResponse{
		Data: struct {
			TotalBlocks              uint64  `json:"total_blocks"`
			TotalTransactions        uint64  `json:"total_transactions"`
			TotalPendingTransactions uint64  `json:"total_pending_transactions"`
			AverageBlockTime         float64 `json:"average_block_time"`
			TotalWallets             uint64  `json:"total_wallets"`
			Transactions24h          uint64  `json:"transactions_24h"`
			PendingTransactions30m   uint64  `json:"pending_transactions_30m"`
		}{
			TotalBlocks:              totalBlocks,
			TotalTransactions:        totalTransactions,
			TotalPendingTransactions: totalPendingTransactions,
			AverageBlockTime:         averageBlockTime,
			TotalWallets:             totalWallets,
			Transactions24h:          transactions24h,
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
		if tx != nil && tx.Timestamp/1000 >= thirtyMinutesAgo {
			count++
		}
	}
	return uint64(count)
}
func getAverageBlockTime(mainStorage storage.IMainStorage, numberOfBlocks uint64, chainId *big.Int) float64 {
	latestQf := storage.QueryFilter{
		SortBy:              "block_number",
		SortOrder:           "desc",
		Limit:               1,
		ForceConsistentData: true,
		ChainId:             chainId,
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
				ChainId:             chainId,
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
