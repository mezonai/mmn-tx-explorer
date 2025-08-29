package handlers

import (
    "fmt"
    "math"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/rs/zerolog/log"
    "github.com/thirdweb-dev/indexer/api"
    "github.com/thirdweb-dev/indexer/internal/storage"
)

// GetWallets returns wallet list with sorting and pagination (default sort by balance desc)
func GetWallets(c *gin.Context) {
    // Parse common query params for consistency
    queryParams, err := api.ParseQueryParams(c.Request)
    if err != nil {
        api.BadRequestErrorHandler(c, err)
        return
    }

    // Set default sort if not provided
    if strings.TrimSpace(queryParams.SortBy) == "" {
        queryParams.SortBy = "balance"
    }
    if strings.TrimSpace(queryParams.SortOrder) == "" {
        queryParams.SortOrder = "desc"
    }

    // Validate fields against wallet table
    if err := api.ValidateGroupByAndSortBy("wallet", queryParams.GroupBy, queryParams.SortBy, queryParams.Aggregates); err != nil {
        api.BadRequestErrorHandler(c, err)
        return
    }

    mainStorage, err := getMainStorage()
    if err != nil {
        log.Error().Err(err).Msg("Error getting main storage")
        api.InternalErrorHandler(c)
        return
    }

    // Count for meta
    countQf := storage.QueryFilter{
        FilterParams:        queryParams.FilterParams,
        ForceConsistentData: queryParams.ForceConsistentData,
    }
    totalItems, err := mainStorage.GetCount("wallet", countQf)
    if err != nil {
        log.Error().Err(err).Msg("Error getting wallets count")
        api.InternalErrorHandler(c)
        return
    }

    // Build query filter
    qf := storage.QueryFilter{
        FilterParams:        queryParams.FilterParams,
        SortBy:              queryParams.SortBy,
        SortOrder:           queryParams.SortOrder,
        Page:                queryParams.Page,
        Limit:               queryParams.Limit,
        ForceConsistentData: queryParams.ForceConsistentData,
        Aggregates:          []string{"address", "account_nonce", "balance", "rank() OVER (ORDER BY balance DESC) AS rank"},
    }

    // Prepare response
    resp := api.QueryResponse{
        Meta: api.Meta{
            Page:       queryParams.Page,
            Limit:      queryParams.Limit,
            TotalItems: int(totalItems),
            TotalPages: int(math.Ceil(float64(totalItems) / float64(queryParams.Limit))),
        },
        Data:         nil,
        Aggregations: nil,
    }

    // Fetch data
    result, err := mainStorage.GetAggregations("wallet", qf)
    if err != nil {
        log.Error().Err(err).Msg("Error querying wallets")
        api.InternalErrorHandler(c)
        return
    }
    var data interface{} = result.Aggregates
    resp.Data = &data
    resp.Aggregations = nil

    sendJSONResponse(c, resp)
}

// WalletDetailResponse represents the response structure for wallet detail
type WalletDetailResponse struct {
    Data map[string]interface{} `json:"data"`
}

// @Summary Get wallet detail
// @Description Retrieve detailed information about a specific wallet
// @Tags wallet
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Param address path string true "Wallet address"
// @Success 200 {object} WalletDetailResponse
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 404 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/wallets/{address}/detail [get]
func GetWalletDetail(c *gin.Context) {
    // Parse common query params (force_consistent_data, etc.)
    queryParams, err := api.ParseQueryParams(c.Request)
    if err != nil {
        api.BadRequestErrorHandler(c, err)
        return
    }

    address := c.Param("address")
    if strings.TrimSpace(address) == "" {
        api.BadRequestErrorHandler(c, fmt.Errorf("address cannot be empty"))
        return
    }

    mainStorage, err := getMainStorage()
    if err != nil {
        log.Error().Err(err).Msg("Error getting main storage")
        api.InternalErrorHandler(c)
        return
    }

    // Build query filter to fetch a single wallet row
    qf := storage.QueryFilter{
        FilterParams:        map[string]string{"address": address},
        Limit:               1,
        ForceConsistentData: queryParams.ForceConsistentData,
        Aggregates:          []string{"address", "account_nonce", "balance"},
    }

    result, err := mainStorage.GetAggregations("wallet", qf)
    if err != nil {
        log.Error().Err(err).Msg("Error querying wallet detail")
        api.InternalErrorHandler(c)
        return
    }
    if len(result.Aggregates) == 0 {
        api.NotFoundErrorHandler(c, fmt.Errorf("wallet not found"))
        return
    }

    // Prepare base response data from wallet table
    resp := WalletDetailResponse{ Data: result.Aggregates[0] }

    // Fetch latest transaction timestamp for this wallet (from OR to)
    txQf := storage.QueryFilter{
        WalletAddress:       address,
        ForceConsistentData: queryParams.ForceConsistentData,
        SortBy:              "transaction_timestamp",
        SortOrder:           "desc",
        Limit:               1,
        Aggregates:         nil,
    }
   
    transactionsResult, err := mainStorage.GetTransactions(txQf)
    if err == nil && len(transactionsResult.Data) > 0 {
        resp.Data["last_balance_update"] = transactionsResult.Data[0].TransactionTimestamp
    }
    sendJSONResponse(c, resp)
}