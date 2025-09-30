package handlers

import (
	"math/big"
	"net/http"
	"strconv"
	"sync"
	"time"
	"context"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/api"
	config "github.com/thirdweb-dev/indexer/configs"
	"github.com/thirdweb-dev/indexer/internal/storage"
	pb "github.com/thirdweb-dev/indexer/proto"
)

// handleTransactionStats builds and returns only transactions page stats fields
func handleTransactionStats(c *gin.Context) {

	timeoutSeconds := config.Cfg.API.ContractApiRequest.Timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Duration(timeoutSeconds)*time.Second)
	defer cancel()

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	time24hAgo := time.Now().Add(-24 * time.Hour)
	timeBasedQf24h := storage.QueryFilter{
		ForceConsistentData: true,
		FilterParams: map[string]string{
			"block_timestamp_gte": strconv.FormatInt(time24hAgo.Unix(), 10),
		},
	}

	var (
		transactions24h uint64
		pendingTxsData *pb.GetPendingTransactionsResponse
		wg              sync.WaitGroup
		errs            = make([]error, 2)
	)

	wg.Add(2)
	go func() {
		defer wg.Done()
		transactions24h, errs[0] = mainStorage.GetCount(ctx, "transactions", timeBasedQf24h)
		}()
	go func() {
		defer wg.Done()
		pendingTxsData, errs[1] = mainStorage.GetPendingTransactions(ctx)
	}()

	wg.Wait()

	for _, err := range errs {
		if err != nil {
			log.Error().Err(err).Msg("Error querying transaction stats")
			api.InternalErrorHandler(c)
			return
		}
	}

	pendingTransactions30m := uint64(0)
	if pendingTxsData != nil {
		pendingTransactions30m = CountPendingTxLast30m(pendingTxsData.PendingTxs)
	}

	resp := &TransactionStatsResponse{}
	resp.Data.Transactions24h = transactions24h
	resp.Data.PendingTransactions30m = pendingTransactions30m

	c.JSON(http.StatusOK, resp)
}

// DashboardStatsResponse represents the dashboard-only stats payload
type DashboardStatsResponse struct {
	Data struct {
		TotalBlocks       uint64  `json:"total_blocks"`
		TotalTransactions uint64  `json:"total_transactions"`
		AverageBlockTime  float64 `json:"average_block_time"`
		TotalWallets      uint64  `json:"total_wallets"`
	} `json:"data"`
}

// TransactionStatsResponse represents the transactions page-only stats payload
type TransactionStatsResponse struct {
	Data struct {
		Transactions24h        uint64 `json:"transactions_24h"`
		PendingTransactions30m uint64 `json:"pending_transactions_30m"`
	} `json:"data"`
}


// GetDashboardStats returns only the dashboard stats payload
func GetDashboardStats(c *gin.Context) {
	handleDashboardStats(c)
}

// GetTransactionStats returns only the transactions page stats payload
func GetTransactionStats(c *gin.Context) {
	handleTransactionStats(c)
}


// handleDashboardStats builds and returns only dashboard stats fields
func handleDashboardStats(c *gin.Context) {

	timeoutSeconds := config.Cfg.API.ContractApiRequest.Timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Duration(timeoutSeconds)*time.Second)
	defer cancel()

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	// Build only the fields needed for dashboard
	countQf := storage.QueryFilter{ForceConsistentData: true}
	var (
		totalBlocks, totalTransactions, totalWallets uint64
		averageBlockTime                             float64
		wg                                           sync.WaitGroup
		errs                                         = make([]error, 4)
	)

	wg.Add(4)
	go func() {
		defer wg.Done()
		totalBlocks, errs[0] = mainStorage.GetCount(ctx, "blocks", countQf)
	}()
	go func() {
		defer wg.Done()
		totalTransactions, errs[1] = mainStorage.GetStatByKey(ctx, "total_transactions")
	}()
	go func() {
		defer wg.Done()
		totalWallets, errs[2] = mainStorage.GetCount(ctx, "wallet", countQf)
	}()
	go func() {
		defer wg.Done()
		averageBlockTime, errs[3] = getAverageBlockTime(mainStorage, 100)
	}()
	wg.Wait()

	for _, err := range errs {
		if err != nil {
			log.Error().Err(err).Msg("Error querying dashboard stats")
			api.InternalErrorHandler(c)
			return
		}
	}

	resp := &DashboardStatsResponse{}
	resp.Data.TotalBlocks = totalBlocks
	resp.Data.TotalTransactions = totalTransactions
	resp.Data.AverageBlockTime = averageBlockTime
	resp.Data.TotalWallets = totalWallets

	c.JSON(http.StatusOK, resp)
}

func getAverageBlockTime(mainStorage storage.IMainStorage, numberOfBlocks uint64) (float64, error) {
	latestQf := storage.QueryFilter{
		SortBy:              "block_number",
		SortOrder:           "desc",
		Limit:               1,
		ForceConsistentData: true,
	}
	latestBlocks, err := mainStorage.GetBlocks(latestQf)
	if err != nil {
		return 0, err
	}
	if len(latestBlocks.Data) == 0 {
		return 0, nil
	}
	
	latest := latestBlocks.Data[0]
	latestTimestamp := latest.Timestamp.Unix()
	latestBlockNumber := latest.Number.Uint64()
	k := numberOfBlocks
	if latestBlockNumber == 0 {
		k = 0
	} else if latestBlockNumber < numberOfBlocks {
		k = latestBlockNumber
	}
	if k <= 0 {
		return 0, nil
	}
	targetNum := int64(latestBlockNumber) - int64(k)
	targetQf := storage.QueryFilter{
		BlockNumbers:        []*big.Int{big.NewInt(targetNum)},
		ForceConsistentData: true,
	}
	
	targetBlocks, err := mainStorage.GetBlocks(targetQf)
	if err != nil {
		return 0, err
	}
	if len(targetBlocks.Data) == 0 {
		return 0, nil
	}
	timestampMinusK := targetBlocks.Data[0].Timestamp.Unix()
	avg := float64(latestTimestamp-timestampMinusK) / float64(k)
	
	if avg <= 0 {
		return 0, nil
	}
	
	return avg, nil
}

func CountPendingTxLast30m(pendingTxs []*pb.TransactionData) uint64 {
	now := uint64(time.Now().Unix())
	thirtyMinutesAgo := now - 1800
	count := 0

	for _, tx := range pendingTxs {
		if tx == nil {
			continue
		}
		txTime := tx.Timestamp / 1000
		if txTime >= thirtyMinutesAgo {
			count++
		} else {
			break
		}
	}
	return uint64(count)
}
