package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/rs/zerolog/log"
)

func ExportTransactionsCSV(c *gin.Context) {
	walletAddress := c.Query("wallet_address")
	if walletAddress == "" {
		c.String(http.StatusBadRequest, "wallet_address is required")
		return
	}

	fromDateStr := c.Query("fromdate")
	toDateStr := c.Query("todate")
	var fromDate, toDate *time.Time
	if fromDateStr != "" {
		t, err := time.Parse("2006-01-02", fromDateStr)
		if err == nil {
			fromDate = &t
		}
	}
	if toDateStr != "" {
		t, err := time.Parse("2006-01-02", toDateStr)
		if err == nil {
			toDate = &t
		}
	}

	sortBy := c.DefaultQuery("sort_by", "transaction_timestamp")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error creating storage connector")
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}

	ctx := c.Request.Context()
	var startTime, endTime int64
	if fromDate != nil {
		startTime = fromDate.Unix()
	} else {
		startTime = 0
	}
	if toDate != nil {
		endTime = toDate.Add(24*time.Hour - time.Second).Unix()
	} else {
		endTime = time.Now().Unix()
	}

	transactions, err := mainStorage.GetAllTransactionsByWallet(ctx, walletAddress, startTime, endTime, sortBy, sortOrder)
	if err != nil {
		log.Error().Err(err).Msg("Error querying all transactions for wallet")
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=transactions_%s.csv", walletAddress))
	c.Header("Content-Type", "text/csv")
	w := csv.NewWriter(c.Writer)
	defer w.Flush()

	w.Write([]string{"hash", "from_address", "to_address", "value", "transaction_timestamp", "block_number", "status", "transaction_type", "text_data", "extra_info"})

	for _, tx := range transactions {
		timestamp := tx.TransactionTimestamp.Format("2006-01-02 15:04:05")
		blockNumber := ""
		if tx.BlockNumber != nil {
			blockNumber = tx.BlockNumber.String()
		}
		status := ""
		if tx.Status != nil {
			status = strconv.FormatUint(*tx.Status, 10)
		}
		w.Write([]string{
			tx.Hash,
			tx.FromAddress,
			tx.ToAddress,
			tx.Value,
			timestamp,
			blockNumber,
			status,
			fmt.Sprintf("%d", tx.TransactionType),
			tx.TextData,
			tx.ExtraInfo,
		})
	}
}
