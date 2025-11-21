package handlers

import (
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mezonai/mmn-tx-explorer/indexer/api"
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
)

const DateFormat = "2006-01-02"

// GetTransactions godoc
// @Summary Get all transactions
// @Description Retrieve all transactions across all contracts
// @Tags transactions
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Param filter query string false "Filter parameters"
// @Param group_by query string false "Field to group results by"
// @Param sort_by query string false "Field to sort results by"
// @Param sort_order query string false "Sort order (asc or desc)"
// @Param page query int false "Page number for pagination"
// @Param limit query int false "Number of items per page" default(5)
// @Param wallet_address query string false "Wallet address to filter transactions (optional)"
// @Param start_time query string false "Start date in YYYY-MM-DD format (defaults to 7 days ago)"
// @Param end_time query string false "End date in YYYY-MM-DD format (defaults to current date)"
// @Param aggregate query []string false "List of aggregate functions to apply"
// @Param force_consistent_data query bool false "Force consistent data at the expense of query speed"
// @Success 200 {object} api.QueryResponse{data=[]common.BaseTransactionModel}
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/transactions [get]
func GetTransactions(c *gin.Context) {
	handleTransactionsRequest(c)
}

func handleTransactionsRequest(c *gin.Context) {
	walletAddress := c.Param("wallet_address")
	queryParams, err := api.ParseQueryParams(c.Request)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	if walletAddress == "" && queryParams.WalletAddress != "" {
		walletAddress = queryParams.WalletAddress
	}

	// Validate GroupBy and SortBy fields
	if validateErr := api.ValidateGroupByAndSortBy("transactions", queryParams.GroupBy, queryParams.SortBy, queryParams.Aggregates); validateErr != nil {
		api.BadRequestErrorHandler(c, validateErr)
		return
	}

	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error creating storage connector")
		api.InternalErrorHandler(c)
		return
	}

	ctx := c.Request.Context()
	// Initialize the QueryResult
	queryResult := api.QueryResponse{
		Meta: api.Meta{
			ChainID:    1337,
			Page:       queryParams.Page,
			Limit:      queryParams.Limit,
			TotalItems: 0,
			TotalPages: 0, // TODO: Implement total pages count
		},
		Data:         nil,
		Aggregations: nil,
	}
	if walletAddress != "" {
		// Get start and end time for filtering
		startTime, endTime := getTimeRangeFromParams(&queryParams)

		totalItems, storeErr := mainStorage.GetTransactionsByWalletCount(ctx, walletAddress, startTime, endTime)
		if storeErr != nil {
			log.Error().Err(storeErr).Msg("Error getting transactions count")
			api.InternalErrorHandler(c)
			return
		}

		offset := queryParams.Page * queryParams.Limit
		transactions, queryErr := mainStorage.GetTransactionsByWalletPaginated(
			ctx,
			walletAddress,
			queryParams.Limit,
			offset,
			queryParams.SortOrder,
			startTime,
			endTime,
		)
		if queryErr != nil {
			log.Error().Err(queryErr).Msg("Error querying transactions")
			api.InternalErrorHandler(c)
			return
		}

		var data interface{} = serializeTransactions(transactions)
		queryResult.Data = &data
		queryResult.Meta.TotalItems = int(totalItems)
		queryResult.Meta.TotalPages = int(math.Ceil(float64(totalItems) / float64(queryParams.Limit)))
		c.JSON(http.StatusOK, queryResult)
		return
	}

	// Prepare the QueryFilter
	qf := &storage.QueryFilter{
		FilterParams:        queryParams.FilterParams,
		SortBy:              queryParams.SortBy,
		SortOrder:           queryParams.SortOrder,
		Page:                queryParams.Page,
		Limit:               queryParams.Limit,
		ForceConsistentData: queryParams.ForceConsistentData,
	}

	// Prepare the QueryFilter for count
	countQf := &storage.QueryFilter{
		FilterParams:        queryParams.FilterParams,
		ForceConsistentData: queryParams.ForceConsistentData,
	}

	// Get the total number of items
	var totalItems uint64
	if len(countQf.FilterParams) > 0 {
		totalItems, err = mainStorage.GetCount(ctx, "transactions", countQf)
	} else {
		totalItems, err = mainStorage.GetTotalTransactions(ctx)
	}
	if err != nil {
		log.Error().Err(err).Msg("Error getting count")
		api.InternalErrorHandler(c)
		return
	}

	transactionsResult, err := mainStorage.GetTransactions(ctx, qf)
	if err != nil {
		log.Error().Err(err).Msg("Error querying transactions")
		// TODO: might want to choose BadRequestError if it's due to not-allowed functions
		api.InternalErrorHandler(c)
		return
	}

	var data interface{} = serializeTransactions(transactionsResult.Data)
	queryResult.Data = &data
	queryResult.Meta.TotalItems = int(totalItems)
	maxItemsDisplayed := min(totalItems, storage.DataRowsDisplayLimit)
	queryResult.Meta.TotalPages = int(math.Ceil(float64(maxItemsDisplayed) / float64(queryParams.Limit)))

	c.JSON(http.StatusOK, queryResult)
}

func serializeTransactions(transactions []common.Transaction) []common.BaseTransactionModel {
	if len(transactions) == 0 {
		return []common.BaseTransactionModel{}
	}
	transactionModels := make([]common.BaseTransactionModel, 0, len(transactions))
	for i := range transactions {
		transactionModels = append(transactionModels, transactions[i].SerializeInternal())
	}
	return transactionModels
}

// getTimeRangeFromParams parses start and end times in YYYY-MM-DD format.
// Defaults to last 7 days if not provided, with configurable max lookback.
func getTimeRangeFromParams(queryParams *api.QueryParams) (start, end int64) {
	now := time.Now()
	defaultStartTime := now.AddDate(0, 0, -7).Unix() // 7 days ago

	// Get max lookback years from config, default to 1 year if not set
	maxLookbackYears := config.Cfg.API.TimeRange.MaxLookbackYears
	if maxLookbackYears <= 0 {
		maxLookbackYears = 1
	}
	maxLookbackTime := now.AddDate(-maxLookbackYears, 0, 0).Unix()

	endTime := now.Unix()

	if queryParams.EndTime != "" {
		if parsedTime, err := time.Parse(DateFormat, queryParams.EndTime); err == nil {
			parsedTime = parsedTime.Add(24*time.Hour - time.Second)
			endTime = parsedTime.Unix()
		}
	}

	startTime := defaultStartTime
	if queryParams.StartTime != "" {
		if parsedTime, err := time.Parse(DateFormat, queryParams.StartTime); err == nil {
			startTime = parsedTime.Unix()

			if startTime < maxLookbackTime {
				startTime = maxLookbackTime
			}
		}
	}

	return startTime, endTime
}

// PendingTransactionModel return type for Swagger documentation
type PendingTransactionModel struct {
	TxHash          string `json:"hash"`
	Sender          string `json:"from_address"`
	Recipient       string `json:"to_address"`
	Amount          string `json:"value"`
	Nonce           uint64 `json:"nonce"`
	Timestamp       uint64 `json:"transaction_timestamp"`
	Status          uint64 `json:"status"`
	TransactionType uint64 `json:"transaction_type"`
}

// GetPendingTransactions godoc
// @Summary Get pending transactions
// @Description Retrieve all pending transactions from mempool
// @Tags transactions
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Success 200 {object} api.QueryResponse{data=[]PendingTransactionModel}
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/pending-transactions [get]
func GetPendingTransactions(c *gin.Context) {
	chainID, err := api.GetChainID(c)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	// Parse pagination params
	queryParams, err := api.ParseQueryParams(c.Request)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	// Get pending transactions from MMN service
	ctx := c.Request.Context()
	pendingResp, err := mainStorage.GetPendingTransactions(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Error getting pending transactions from MMN service")
		api.InternalErrorHandler(c)
		return
	}

	if pendingResp == nil || pendingResp.Error != "" {
		log.Error().Msgf("MMN service error: %s", pendingResp.Error)
		api.InternalErrorHandler(c)
		return
	}

	// Compute pagination over full pending set received from node
	totalItems := int(pendingResp.TotalCount)
	limit := queryParams.Limit
	page := queryParams.Page
	if limit <= 0 {
		limit = 5
	}
	if page < 0 {
		page = 0
	}

	start := page * limit
	if start > totalItems {
		start = totalItems
	}
	end := start + limit
	if end > totalItems {
		end = totalItems
	}

	var sliced []*pb.TransactionData
	if pendingResp.PendingTxs != nil && start < end {
		sliced = pendingResp.PendingTxs[start:end]
	} else {
		sliced = []*pb.TransactionData{}
	}

	// Prepare response with pagination meta
	queryResult := api.QueryResponse{
		Meta: api.Meta{
			ChainID:    chainID.Uint64(),
			Page:       page,
			Limit:      limit,
			TotalItems: totalItems,
			TotalPages: int(math.Ceil(float64(totalItems) / float64(limit))),
		},
	}

	// Serialize pending transactions page
	var data interface{} = serializePendingTransactions(sliced)
	queryResult.Data = &data

	c.JSON(http.StatusOK, queryResult)
}

// @Summary Get pending transaction detail
// @Description Retrieve a single pending transaction by transaction hash
// @Tags transactions
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Param transactionHash path string true "Transaction hash"
// @Success 200 {object} api.QueryResponse{data=PendingTransactionModel}
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 404 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/pending-transactions/{transactionHash} [get]

type PendingTransactionDetailResponse struct {
	Data struct {
		Transaction PendingTransactionModel `json:"transaction"`
	} `json:"data"`
}

func GetPendingTransactionDetail(c *gin.Context) {
	hash := c.Param("transaction_hash")
	if hash == "" {
		api.BadRequestErrorHandler(c, fmt.Errorf("missing transaction hash"))
		return
	}

	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	ctx := c.Request.Context()
	pendingResp, err := mainStorage.GetPendingTransactions(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Error getting pending transactions from MMN service")
		api.InternalErrorHandler(c)
		return
	}

	if pendingResp == nil || pendingResp.Error != "" {
		log.Error().Msgf("MMN service error: %s", pendingResp.Error)
		api.InternalErrorHandler(c)
		return
	}

	var found *pb.TransactionData
	if pendingResp.PendingTxs != nil {
		for _, tx := range pendingResp.PendingTxs {
			if tx != nil && tx.TxHash == hash {
				found = tx
				break
			}
		}
	}

	if found == nil {
		c.JSON(http.StatusNotFound, api.Error{Message: "Pending transaction not found"})
		return
	}

	model := PendingTransactionModel{
		TxHash:          found.TxHash,
		Sender:          found.Sender,
		Recipient:       found.Recipient,
		Amount:          found.Amount,
		Nonce:           found.Nonce,
		Timestamp:       found.Timestamp / 1000,
		Status:          0,
		TransactionType: 0,
	}

	transactionDetailResponse := PendingTransactionDetailResponse{
		Data: struct {
			Transaction PendingTransactionModel `json:"transaction"`
		}{
			Transaction: model,
		},
	}
	c.JSON(http.StatusOK, transactionDetailResponse)
}

func serializePendingTransactions(pendingTxs []*pb.TransactionData) []PendingTransactionModel {
	if pendingTxs == nil {
		return []PendingTransactionModel{}
	}

	models := make([]PendingTransactionModel, len(pendingTxs))
	for i, tx := range pendingTxs {
		models[i] = PendingTransactionModel{
			TxHash:          tx.TxHash,
			Sender:          tx.Sender,
			Recipient:       tx.Recipient,
			Amount:          tx.Amount,
			Nonce:           tx.Nonce,
			Timestamp:       tx.Timestamp / 1000,
			Status:          0,
			TransactionType: 0,
		}
	}
	return models
}
