package handlers

import (
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mezonai/mmn-tx-explorer/indexer/api"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
)

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
// @Param aggregate query []string false "List of aggregate functions to apply"
// @Param force_consistent_data query bool false "Force consistent data at the expense of query speed"
// @Success 200 {object} api.QueryResponse{data=[]common.TransactionModel}
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/transactions [get]
func GetTransactions(c *gin.Context) {
	handleTransactionsRequest(c)
}

// @Summary Get transactions for infinite scroll
// @Description Retrieve transactions with cursor-based pagination for infinite scroll
// @Tags transactions
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Param timestamp_lt query string false "Timestamp less than (from last page) in ISO 8601 format (e.g., 2025-10-11T11:00:21.203Z)" format(date-time)
// @Param last_hash query string false "Last transaction hash (for pagination)"
// @Param limit query int false "Number of items per page" default(20)
// @Param wallet_address query string false "Wallet address to filter transactions"
// @Param filter_from_address query string false "From address to filter transactions"
// @Param filter_to_address query string false "To address to filter transactions"
// @Success 200 {object} api.QueryResponse{data=[]common.TransactionModel}
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/transactions/infinite [get]
func GetTransactionsInfinite(c *gin.Context) {
	handleTransactionsInfiniteRequest(c)
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
	if err := api.ValidateGroupByAndSortBy("transactions", queryParams.GroupBy, queryParams.SortBy, queryParams.Aggregates); err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error creating storage connector")
		api.InternalErrorHandler(c)
		return
	}

	ctx := c.Request.Context()
	// Initialize the QueryResult
	queryResult := api.QueryResponse{
		Meta: api.Meta{
			ChainId:    1337,
			Page:       queryParams.Page,
			Limit:      queryParams.Limit,
			TotalItems: 0,
			TotalPages: 0, // TODO: Implement total pages count
		},
		Data:         nil,
		Aggregations: nil,
	}
	if walletAddress != "" {
		totalItems, err := mainStorage.GetTransactionsByWalletCount(ctx, walletAddress)
		if err != nil {
			log.Error().Err(err).Msg("Error getting transactions count")
			api.InternalErrorHandler(c)
			return
		}

		offset := queryParams.Page * queryParams.Limit
		transactions, err := mainStorage.GetTransactionsByWalletPaginated(
			ctx,
			walletAddress,
			queryParams.Limit,
			offset,
			queryParams.SortBy,
			queryParams.SortOrder,
		)
		if err != nil {
			log.Error().Err(err).Msg("Error querying transactions")
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
	qf := storage.QueryFilter{
		FilterParams:        queryParams.FilterParams,
		SortBy:              queryParams.SortBy,
		SortOrder:           queryParams.SortOrder,
		Page:                queryParams.Page,
		Limit:               queryParams.Limit,
		ForceConsistentData: queryParams.ForceConsistentData,
	}

	// Prepare the QueryFilter for count
	countQf := storage.QueryFilter{
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
	maxItemsDisplayed := min(totalItems, storage.DATA_ROWS_DISPLAY_LIMIT)
	queryResult.Meta.TotalPages = int(math.Ceil(float64(maxItemsDisplayed) / float64(queryParams.Limit)))

	c.JSON(http.StatusOK, queryResult)
}

func handleTransactionsInfiniteRequest(c *gin.Context) {
	queryParams, err := api.ParseQueryParams(c.Request)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	walletAddress := queryParams.WalletAddress
	var fromAddress, toAddress string

	if filterParams, ok := queryParams.FilterParams["from_address"]; ok {
		fromAddress = filterParams
	}

	if filterParams, ok := queryParams.FilterParams["to_address"]; ok {
		toAddress = filterParams
	}

	if walletAddress == "" && fromAddress == "" && toAddress == "" {
		api.BadRequestErrorHandler(c, fmt.Errorf("at least one of wallet_address, filter_from_address, or filter_to_address is required"))
		return
	}

	timestampLt := queryParams.TimestampLt
	lastHash := queryParams.LastHash

	chainId, err := api.GetChainId(c)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error creating storage connector")
		api.InternalErrorHandler(c)
		return
	}

	ctx := c.Request.Context()

	queryResult := api.QueryResponse{
		Meta: api.Meta{
			ChainId: chainId.Uint64(),
			Page:    0,
			Limit:   queryParams.Limit,
		},
		Data: nil,
	}

	var transactions []common.Transaction

	if walletAddress != "" {
		txs, err := mainStorage.GetTransactionsByWalletWithTimestamp(
			ctx,
			walletAddress,
			queryParams.Limit+1,
			timestampLt,
			lastHash,
		)
		if err != nil {
			log.Error().Err(err).Msg("Error querying transactions by wallet")
			api.InternalErrorHandler(c)
			return
		}
		transactions = txs
	} else if fromAddress != "" {
		txs, err := mainStorage.GetTransactionsByFromAddressWithTimestamp(
			ctx,
			fromAddress,
			queryParams.Limit+1,
			timestampLt,
			lastHash,
		)
		if err != nil {
			log.Error().Err(err).Msg("Error querying transactions by from_address")
			api.InternalErrorHandler(c)
			return
		}
		transactions = txs
	} else {
		txs, err := mainStorage.GetTransactionsByToAddressWithTimestamp(
			ctx,
			toAddress,
			queryParams.Limit+1,
			timestampLt,
			lastHash,
		)
		if err != nil {
			log.Error().Err(err).Msg("Error querying transactions by to_address")
			api.InternalErrorHandler(c)
			return
		}
		transactions = txs
	}

	hasMore := len(transactions) > queryParams.Limit
	if hasMore {
		transactions = transactions[:queryParams.Limit]
	}

	var nextTimestamp time.Time
	var nextHash string
	if len(transactions) > 0 {
		lastTx := transactions[len(transactions)-1]
		nextTimestamp = lastTx.TransactionTimestamp
		nextHash = lastTx.Hash
	}

	var data interface{} = serializeTransactions(transactions)
	queryResult.Data = &data

	queryResult.Meta.HasMore = hasMore
	queryResult.Meta.NextTimestamp = &nextTimestamp
	queryResult.Meta.NextHash = nextHash

	c.JSON(http.StatusOK, queryResult)
}

func serializeTransactions(transactions []common.Transaction) []common.TransactionModel {
	if len(transactions) == 0 {
		return []common.TransactionModel{}
	}
	transactionModels := make([]common.TransactionModel, 0, len(transactions))
	for _, transaction := range transactions {
		transactionModels = append(transactionModels, transaction.Serialize())
	}
	return transactionModels
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
	chainId, err := api.GetChainId(c)
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

	mainStorage, err := getMainStorage()
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
			ChainId:    chainId.Uint64(),
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

	mainStorage, err := getMainStorage()
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
