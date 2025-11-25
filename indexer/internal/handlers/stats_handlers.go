package handlers

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mezonai/mmn-tx-explorer/indexer/api"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
)

// handleTransactionStats builds and returns only transactions page stats fields
func handleTransactionStats(c *gin.Context) {
	ctx := c.Request.Context()
	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	time24hAgo := time.Now().Add(-24 * time.Hour)
	timeBasedQf24h := &storage.QueryFilter{
		ForceConsistentData: true,
		FilterParams: map[string]string{
			"transaction_timestamp_gte": strconv.FormatInt(time24hAgo.Unix(), 10),
		},
	}

	var (
		transactions24h uint64
		pendingTxsData  *pb.GetPendingTransactionsResponse
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

	if pendingTxsData != nil {
		transactions24h += pendingTxsData.TotalCount
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
	ctx := c.Request.Context()
	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	// Build only the fields needed for dashboard
	countQf := &storage.QueryFilter{ForceConsistentData: true}
	var (
		totalBlocks, totalTransactions, totalWallets uint64
		averageBlockTime                             float64
		err1                                         error
	)

	totalBlocks, totalTransactions, totalWallets, averageBlockTime, err1 = mainStorage.GetDashboardStats(ctx, countQf)
	if err1 != nil {
		log.Error().Err(err1).Msg("Error getting dashboard stats")
		api.InternalErrorHandler(c)
		return
	}

	resp := &DashboardStatsResponse{}
	resp.Data.TotalBlocks = totalBlocks
	resp.Data.TotalTransactions = totalTransactions
	resp.Data.AverageBlockTime = averageBlockTime
	resp.Data.TotalWallets = totalWallets

	c.JSON(http.StatusOK, resp)
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
