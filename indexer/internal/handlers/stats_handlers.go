package handlers

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/api"
	"github.com/thirdweb-dev/indexer/internal/storage"
	pb "github.com/thirdweb-dev/indexer/proto"
	"context"
)

var (
    statsCache     *StatsResponse
    statsCacheTime time.Time
    statsMutex    sync.RWMutex
    cacheTTL      = 3 * time.Second
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
    statsMutex.RLock()
    if time.Since(statsCacheTime) < cacheTTL && statsCache != nil {
        defer statsMutex.RUnlock()
        c.JSON(http.StatusOK, statsCache)
        return
    }
    statsMutex.RUnlock()

    ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
    defer cancel()

    mainStorage, err := getMainStorage()
    if err != nil {
        log.Error().Err(err).Msg("Error getting main storage")
        api.InternalErrorHandler(c)
        return
    }

    countQf := storage.QueryFilter{
        ForceConsistentData: true,
    }

    time24hAgo := time.Now().Add(-24 * time.Hour)
    timeBasedQf24h := storage.QueryFilter{
        ForceConsistentData: true,
        FilterParams: map[string]string{
            "block_timestamp_gte": strconv.FormatInt(time24hAgo.Unix(), 10),
        },
    }

    var (
        totalBlocks, totalTransactions, totalWallets, transactions24h uint64
        pendingTxsData *pb.GetPendingTransactionsResponse
        averageBlockTime float64
        wg sync.WaitGroup
        errs = make([]error, 5)
    )

    wg.Add(5)

    go func() {
        defer wg.Done()
        totalBlocks, errs[0] = mainStorage.GetCount("blocks", countQf)
    }()

    go func() {
        defer wg.Done()
        totalTransactions, errs[1] = mainStorage.GetCount("transactions", countQf)
    }()

    go func() {
        defer wg.Done()
        totalWallets, errs[2] = mainStorage.GetCount("wallet", countQf)
    }()

    go func() {
        defer wg.Done()
        transactions24h, errs[3] = mainStorage.GetCount("transactions", timeBasedQf24h)
    }()

    go func() {
        defer wg.Done()
        pendingTxsData, errs[4] = mainStorage.GetPendingTransactions(ctx)
    }()

    var avgErr error
    wg.Add(1)
	go func() {
		defer wg.Done()
		averageBlockTime = getAverageBlockTime(mainStorage, 100)
	}()

    wg.Wait()

    for _, err := range errs {
        if err != nil {
            log.Error().Err(err).Msg("Error querying stats")
            api.InternalErrorHandler(c)
            return
        }
    }
    if avgErr != nil {
        log.Error().Err(avgErr).Msg("Error calculating average block time")
        api.InternalErrorHandler(c)
        return
    }

    totalPendingTransactions := uint64(0)
    pendingTransactions30m := uint64(0)
    if pendingTxsData != nil {
        totalPendingTransactions = pendingTxsData.TotalCount
        pendingTransactions30m = CountPendingTxLast30m(pendingTxsData.PendingTxs)
        totalTransactions += totalPendingTransactions
        transactions24h += totalPendingTransactions
    }

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

    statsMutex.Lock()
    statsCache = &statsResponse
    statsCacheTime = time.Now()
    statsMutex.Unlock()

    c.JSON(http.StatusOK, statsResponse)
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
