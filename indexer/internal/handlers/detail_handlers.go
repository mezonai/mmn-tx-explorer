package handlers

import (
	"fmt"
	"math/big"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/api"
	"github.com/thirdweb-dev/indexer/internal/common"
	"github.com/thirdweb-dev/indexer/internal/storage"
)


// BlockDetailResponse represents the response structure for block detail
type BlockDetailResponse struct {
	Data struct {
		Block        common.BlockModel        `json:"block"`
		Transactions []common.TransactionModel `json:"transactions"`
	} `json:"data"`
}

// TransactionDetailResponse represents the response structure for transaction detail
type TransactionDetailResponse struct {
	Data struct {
		Transaction common.TransactionModel `json:"transaction"`
	} `json:"data"`
}

// @Summary Get block detail
// @Description Retrieve detailed information about a specific block including all transactions
// @Tags detail
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Param blockNumber path string true "Block number"
// @Success 200 {object} BlockDetailResponse
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 404 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/blocks/{blockNumber}/detail [get]
func GetBlockDetail(c *gin.Context) {
	handleBlockDetailRequest(c)
}

// @Summary Get transaction detail
// @Description Retrieve detailed information about a specific transaction including logs and traces
// @Tags detail
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param chainId path string true "Chain ID"
// @Param txHash path string true "Transaction hash"
// @Success 200 {object} TransactionDetailResponse
// @Failure 400 {object} api.Error
// @Failure 401 {object} api.Error
// @Failure 404 {object} api.Error
// @Failure 500 {object} api.Error
// @Router /{chainId}/transactions/{txHash}/detail [get]
func GetTransactionDetail(c *gin.Context) {
	handleTransactionDetailRequest(c)
}

func handleBlockDetailRequest(c *gin.Context) {
	chainId, err := api.GetChainId(c)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	blockNumberStr := c.Param("blockNumber")
	if blockNumberStr == "" {
		api.BadRequestErrorHandler(c, fmt.Errorf("block number cannot be empty"))
		return
	}

	blockNumber, ok := new(big.Int).SetString(blockNumberStr, 10)
	if !ok || blockNumber.Sign() == -1 {
		api.BadRequestErrorHandler(c, fmt.Errorf("invalid block number '%s'", blockNumberStr))
		return
	}

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	// Get block details
	blockResult, err := mainStorage.GetBlocks(storage.QueryFilter{
		ChainId:      chainId,
		BlockNumbers: []*big.Int{blockNumber},
		Limit:        1,
	})
	if err != nil {
		log.Error().Err(err).Msg("Error getting block details")
		api.InternalErrorHandler(c)
		return
	}

	if len(blockResult.Data) == 0 {
		api.NotFoundErrorHandler(c, fmt.Errorf("block %s not found", blockNumberStr))
		return
	}

	block := blockResult.Data[0].Serialize()

	// Get all transactions in this block
	transactionsResult, err := mainStorage.GetTransactions(storage.QueryFilter{
		ChainId:      chainId,
		BlockNumbers: []*big.Int{blockNumber},
		SortBy:       "nonce",
		SortOrder:    "asc",
	})
	if err != nil {
		log.Error().Err(err).Msg("Error getting block transactions")
		api.InternalErrorHandler(c)
		return
	}

	transactions := make([]common.TransactionModel, len(transactionsResult.Data))
	for i, tx := range transactionsResult.Data {
		transactions[i] = tx.Serialize()
	}

	// Initialize the BlockDetailResponse
	blockDetailResponse := BlockDetailResponse{
		Data: struct {
			Block        common.BlockModel        `json:"block"`
			Transactions []common.TransactionModel `json:"transactions"`
		}{
			Block:        block,
			Transactions: transactions,
		},
	}

	c.JSON(http.StatusOK, blockDetailResponse)
}

func handleTransactionDetailRequest(c *gin.Context) {
	chainId, err := api.GetChainId(c)
	if err != nil {
		api.BadRequestErrorHandler(c, err)
		return
	}

	txHash := c.Param("txHash")
	if txHash == "" {
		api.BadRequestErrorHandler(c, fmt.Errorf("transaction hash cannot be empty"))
		return
	}

	mainStorage, err := getMainStorage()
	if err != nil {
		log.Error().Err(err).Msg("Error getting main storage")
		api.InternalErrorHandler(c)
		return
	}

	// Get transaction details
	transactionResult, err := mainStorage.GetTransactions(storage.QueryFilter{
		ChainId: chainId,
		FilterParams: map[string]string{
			"hash": txHash,
		},
		Limit: 1,
	})
	if err != nil {
		log.Error().Err(err).Msg("Error getting transaction details")
		api.InternalErrorHandler(c)
		return
	}

	if len(transactionResult.Data) == 0 {
		api.NotFoundErrorHandler(c, fmt.Errorf("transaction %s not found", txHash))
		return
	}

	transaction := transactionResult.Data[0].Serialize()



	// Initialize the TransactionDetailResponse
	transactionDetailResponse := TransactionDetailResponse{
		Data: struct {
			Transaction common.TransactionModel `json:"transaction"`
		}{
			Transaction: transaction,
		},
	}

	c.JSON(http.StatusOK, transactionDetailResponse)
}

