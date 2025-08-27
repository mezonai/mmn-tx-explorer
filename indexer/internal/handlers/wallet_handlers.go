package handlers

import (
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
        Aggregates:          []string{"address", "account_nonce", "balance"},
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
