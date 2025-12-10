package rpc

import (
	"context"
	"fmt"
	"math/big"
	"sort"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	pb "github.com/mezonai/mmn-tx-explorer/indexer/proto"
	"github.com/rs/zerolog/log"
)

type GetFullBlockResult struct {
	BlockNumber *big.Int
	Error       error
	Data        common.BlockData
}

type GetBlocksResult struct {
	BlockNumber *big.Int
	Error       error
	Data        common.Block
}

type GetTransactionsResult struct {
	Error error
	Data  common.Transaction
}

type BlocksPerRequestConfig struct {
	Blocks             int
	Logs               int
	Traces             int
	Receipts           int
	ConcurrentRequests int
}

type IRPCClient interface {
	GetFullBlocks(ctx context.Context, blockNumbers []*big.Int) []GetFullBlockResult
	GetBlocks(ctx context.Context, blockNumbers []*big.Int) []GetBlocksResult
	GetTransactions(ctx context.Context, txHashes []string) []GetTransactionsResult
	GetLatestBlockNumber(ctx context.Context) (*big.Int, error)
	GetChainID() *big.Int
	GetURL() string
	GetBlocksPerRequest() BlocksPerRequestConfig
	IsWebsocket() bool
	SupportsTraceBlock() bool
	SupportsBlockReceipts() bool
	HasCode(ctx context.Context, address string) (bool, error)
	Close()
}

type Client struct {
	mmnService       *MMNGrpcService
	chainID          *big.Int
	blocksPerRequest BlocksPerRequestConfig
}

func Initialize() (IRPCClient, error) {
	mmnService, err := NewMMNGrpcService(config.Cfg.RPC.MMNGRPCURL, config.Cfg.RPC.MMNGRPCUseTLS)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to initialize MMNGrpcService, continuing without it")
	}

	rpc := &Client{
		mmnService:       mmnService,
		blocksPerRequest: GetBlockPerRequestConfig(),
	}

	rpc.chainID = big.NewInt(1337)
	return IRPCClient(rpc), nil
}

func (rpc *Client) GetFullBlocks(ctx context.Context, blockNumbers []*big.Int) []GetFullBlockResult {
	if rpc.mmnService == nil {
		return []GetFullBlockResult{{
			Error: fmt.Errorf("MMNGrpcService not available"),
		}}
	}

	if len(blockNumbers) == 0 {
		return []GetFullBlockResult{}
	}

	if ok, sorted := rpc.areBlocksConsecutive(blockNumbers); ok {
		return rpc.getFullBlocksByRange(ctx, sorted)
	}

	return rpc.getFullBlocksByNumber(ctx, blockNumbers)
}

func (rpc *Client) areBlocksConsecutive(blockNumbers []*big.Int) (bool, []*big.Int) {
	if len(blockNumbers) <= 1 {
		return true, blockNumbers
	}

	sorted := make([]*big.Int, len(blockNumbers))
	copy(sorted, blockNumbers)

	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Cmp(sorted[j]) < 0
	})

	for i := 1; i < len(sorted); i++ {
		diff := new(big.Int).Sub(sorted[i], sorted[i-1])
		if diff.Cmp(big.NewInt(1)) != 0 {
			return false, sorted
		}
	}
	return true, sorted
}

func (rpc *Client) getFullBlocksByRange(ctx context.Context, sorted []*big.Int) []GetFullBlockResult {
	fromSlot := sorted[0].Uint64()
	toSlot := sorted[len(sorted)-1].Uint64()

	res, err := rpc.mmnService.GetBlockByRange(ctx, fromSlot, toSlot)
	if err != nil {
		log.Error().
			Uint64("from_slot", fromSlot).
			Uint64("to_slot", toSlot).
			Err(err).
			Msg("GetFullBlocks: MMN service error - failed to get blocks by range")
		return []GetFullBlockResult{{
			Error: fmt.Errorf("failed to get blocks by range: %v", err),
		}}
	}

	log.Info().
		Int("requested_blocks", len(sorted)).
		Int("response_blocks_count", len(res.Blocks)).
		Uint64("from_slot", fromSlot).
		Uint64("to_slot", toSlot).
		Msg("GetFullBlocks: MMN service range response received")

	rawBlocks := make([]RPCFetchBatchResult[*big.Int, common.RawBlock], len(sorted))

	blockMap := make(map[uint64]*pb.BlockInfo)
	for _, blk := range res.Blocks {
		if blk != nil {
			blockMap[blk.Slot] = blk
		}
	}

	successfulBlocks := 0
	failedBlocks := 0

	for i, blockNum := range sorted {
		slot := blockNum.Uint64()
		if blk, exists := blockMap[slot]; exists {
			rawBlock := convertPBBlockInfoToRawBlock(blk)
			rawBlocks[i] = RPCFetchBatchResult[*big.Int, common.RawBlock]{
				Key:    blockNum,
				Result: rawBlock,
				Error:  nil,
			}
			successfulBlocks++
		} else {
			failedBlocks++
			rawBlocks[i] = RPCFetchBatchResult[*big.Int, common.RawBlock]{
				Key:    blockNum,
				Result: nil,
				Error:  fmt.Errorf("block not found in range response"),
			}
		}
	}

	log.Info().
		Int("requested_blocks", len(sorted)).
		Int("successful_blocks", successfulBlocks).
		Int("failed_blocks", failedBlocks).
		Msg("GetFullBlocks: range processing summary")

	results := SerializeFullBlocks(rpc.chainID, rawBlocks, nil, nil, nil)
	return results
}

func (rpc *Client) getFullBlocksByNumber(ctx context.Context, blockNumbers []*big.Int) []GetFullBlockResult {
	nums := make([]uint64, len(blockNumbers))
	for i, n := range blockNumbers {
		nums[i] = n.Uint64()
	}

	res, err := rpc.mmnService.GetBlockByNumber(ctx, nums)
	if err != nil {
		log.Error().
			Int("requested_blocks", len(blockNumbers)).
			Interface("requested_block_numbers", blockNumbers).
			Err(err).
			Msg("GetFullBlocks: MMN service error - failed to get blocks")
		return []GetFullBlockResult{{
			Error: fmt.Errorf("failed to get full block: %v", err),
		}}
	}

	log.Info().
		Int("requested_blocks", len(blockNumbers)).
		Int("response_blocks_count", len(res.Blocks)).
		Msg("GetFullBlocks: MMN service response received")

	rawBlocks := make([]RPCFetchBatchResult[*big.Int, common.RawBlock], len(blockNumbers))

	successfulBlocks := 0
	failedBlocks := 0

	for i, blk := range res.Blocks {
		if i >= len(blockNumbers) {
			log.Warn().
				Int("index", i).
				Int("response_blocks_length", len(res.Blocks)).
				Int("requested_blocks_length", len(blockNumbers)).
				Msg("GetFullBlocks: response has more blocks than requested - index out of range")
			break
		}

		if blk != nil {
			rawBlock := convertPBBlockToRawBlock(blk)
			rawBlocks[i] = RPCFetchBatchResult[*big.Int, common.RawBlock]{
				Key:    blockNumbers[i],
				Result: rawBlock,
				Error:  nil,
			}
			successfulBlocks++
			log.Debug().
				Int("index", i).
				Str("block_number", blockNumbers[i].String()).
				Msg("GetFullBlocks: successfully processed block")
		} else {
			failedBlocks++
			log.Warn().
				Int("index", i).
				Str("requestedBlock", blockNumbers[i].String()).
				Int("response_blocks_length", len(res.Blocks)).
				Int("requested_blocks_length", len(blockNumbers)).
				Msg("GetFullBlocks: received nil block from MMN service - block may not exist")
			rawBlocks[i] = RPCFetchBatchResult[*big.Int, common.RawBlock]{
				Key:    blockNumbers[i],
				Result: nil,
				Error:  fmt.Errorf("block not found"),
			}
		}
	}

	// Handle case where response has fewer blocks than requested
	if len(res.Blocks) < len(blockNumbers) {
		log.Warn().
			Int("response_blocks_count", len(res.Blocks)).
			Int("requested_blocks_count", len(blockNumbers)).
			Int("missing_blocks", len(blockNumbers)-len(res.Blocks)).
			Msg("GetFullBlocks: MMN service returned fewer blocks than requested")

		// Mark missing blocks as failed
		for i := len(res.Blocks); i < len(blockNumbers); i++ {
			failedBlocks++
			rawBlocks[i] = RPCFetchBatchResult[*big.Int, common.RawBlock]{
				Key:    blockNumbers[i],
				Result: nil,
				Error:  fmt.Errorf("block not returned by MMN service"),
			}
			log.Warn().
				Int("index", i).
				Str("block_number", blockNumbers[i].String()).
				Msg("GetFullBlocks: block missing from MMN response")
		}
	}

	log.Info().
		Int("requested_blocks", len(blockNumbers)).
		Int("response_blocks", len(res.Blocks)).
		Int("successful_blocks", successfulBlocks).
		Int("failed_blocks", failedBlocks).
		Msg("GetFullBlocks: block processing summary")

	results := SerializeFullBlocks(rpc.chainID, rawBlocks, nil, nil, nil)

	// Final summary: count successful vs failed results
	unknown := "unknown"
	finalSuccessfulCount := 0
	finalFailedCount := 0
	var failedBlockNumbers []string

	for idx := range results {
		r := &results[idx]
		if r.Error != nil {
			finalFailedCount++
			if idx < len(rawBlocks) {
				failedBlockNumbers = append(failedBlockNumbers, rawBlocks[idx].Key.String())
			}
			log.Warn().
				Int("idx", idx).
				Str("requestedBlock", func() string {
					if idx < len(rawBlocks) {
						return rawBlocks[idx].Key.String()
					}
					return unknown
				}()).
				Err(r.Error).
				Msg("GetFullBlocks: result has error")
		} else if r.BlockNumber != nil {
			finalSuccessfulCount++
		}

		if r.BlockNumber == nil {
			log.Warn().
				Int("idx", idx).
				Str("requestedBlock", func() string {
					if idx < len(rawBlocks) {
						return rawBlocks[idx].Key.String()
					}
					return unknown
				}()).
				Msg("GetFullBlocks: result has nil BlockNumber")
		}
	}

	// Final summary log
	log.Info().
		Int("requested_blocks", len(blockNumbers)).
		Int("results_count", len(results)).
		Int("successful", finalSuccessfulCount).
		Int("failed", finalFailedCount).
		Interface("failed_block_numbers", func() interface{} {
			if len(failedBlockNumbers) > 10 {
				return append(failedBlockNumbers[:10], fmt.Sprintf("... and %d more", len(failedBlockNumbers)-10))
			}
			return failedBlockNumbers
		}()).
		Msg("GetFullBlocks: final results summary")

	return results
}

func (rpc *Client) GetLatestBlockNumber(ctx context.Context) (*big.Int, error) {
	if rpc.mmnService == nil {
		return nil, fmt.Errorf("MMNGrpcService not available")
	}

	res, err := rpc.mmnService.GetBlockNumber(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest block number: %v", err)
	}

	log.Debug().Uint64("blockNumber", res.BlockNumber).Msg("Got latest block number from MMN")
	return new(big.Int).SetUint64(res.BlockNumber), nil
}

func (rpc *Client) GetChainID() *big.Int {
	return rpc.chainID
}

func (rpc *Client) GetURL() string {
	return ""
}

func (rpc *Client) GetBlocksPerRequest() BlocksPerRequestConfig {
	return rpc.blocksPerRequest
}

func (rpc *Client) IsWebsocket() bool {
	return false
}

func (rpc *Client) SupportsTraceBlock() bool {
	return false
}

func (rpc *Client) SupportsBlockReceipts() bool {
	return false
}

func (rpc *Client) Close() {
	if rpc.mmnService != nil {
		err := rpc.mmnService.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close MMN gRPC service")
		}
	}
}

func (rpc *Client) HasCode(ctx context.Context, address string) (bool, error) {
	return false, nil
}

func (rpc *Client) GetBlocks(ctx context.Context, blockNumbers []*big.Int) []GetBlocksResult {
	fullBlocks := rpc.GetFullBlocks(ctx, blockNumbers)

	results := make([]GetBlocksResult, len(fullBlocks))
	for i := range fullBlocks {
		fullBlock := &fullBlocks[i]
		results[i] = GetBlocksResult{
			BlockNumber: fullBlock.BlockNumber,
			Error:       fullBlock.Error,
			Data:        fullBlock.Data.Block,
		}
	}

	return results
}

func (rpc *Client) GetTransactions(ctx context.Context, txHashes []string) []GetTransactionsResult {
	results := make([]GetTransactionsResult, len(txHashes))
	for i := range txHashes {
		results[i] = GetTransactionsResult{
			Error: fmt.Errorf("GetTransactions not supported for MMN gRPC"),
			Data:  common.Transaction{},
		}
	}
	return results
}

// convertPBBlockToRawBlock converts a protobuf Block to common.RawBlock format
func convertPBBlockToRawBlock(pbBlock *pb.Block) common.RawBlock {
	rawBlock := make(common.RawBlock)

	// Convert slot to block number
	rawBlock["number"] = fmt.Sprintf("%x", pbBlock.Slot)

	// Convert hash
	rawBlock["hash"] = fmt.Sprintf("%x", pbBlock.Hash)
	rawBlock["parentHash"] = fmt.Sprintf("%x", pbBlock.PrevHash)

	// Convert timestamp
	rawBlock["timestamp"] = fmt.Sprintf("%x", pbBlock.Timestamp)

	// Convert miner/author
	rawBlock["miner"] = pbBlock.LeaderId

	// Convert transactions from TransactionData
	var transactions []interface{}
	if pbBlock.TransactionData != nil {
		for i, txData := range pbBlock.TransactionData {
			rawTx := convertPBTransactionDataToRawTransaction(
				txData,
				fmt.Sprintf("%x", pbBlock.Hash),
				pbBlock.Slot,
				uint64(i),
			)
			transactions = append(transactions, rawTx)
		}
	}
	rawBlock["transactions"] = transactions

	// Set default values for Ethereum-compatible fields
	rawBlock["nonce"] = "0x0"
	rawBlock["sha3Uncles"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["mixHash"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["stateRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["transactionsRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["receiptsRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["logsBloom"] = "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["difficulty"] = "0x0"
	rawBlock["totalDifficulty"] = "0x0"
	rawBlock["size"] = "0x0"
	rawBlock["extraData"] = "0x" //nolint:goconst // protocol literal
	rawBlock["gasLimit"] = "0x0"
	rawBlock["gasUsed"] = "0x0"
	rawBlock["baseFeePerGas"] = "0x0"
	rawBlock["withdrawalsRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"

	return rawBlock
}

// convertPBBlockInfoToRawBlock converts a protobuf BlockInfo to common.RawBlock format
func convertPBBlockInfoToRawBlock(pbBlockInfo *pb.BlockInfo) common.RawBlock {
	rawBlock := make(common.RawBlock)

	// Convert slot to block number
	rawBlock["number"] = fmt.Sprintf("%x", pbBlockInfo.Slot)

	// Convert hash
	rawBlock["hash"] = fmt.Sprintf("%x", pbBlockInfo.Hash)
	rawBlock["parentHash"] = fmt.Sprintf("%x", pbBlockInfo.PrevHash)

	// Convert timestamp
	rawBlock["timestamp"] = fmt.Sprintf("%x", pbBlockInfo.Timestamp)

	// Convert miner/author
	rawBlock["miner"] = pbBlockInfo.LeaderId

	// Convert transactions from TransactionData
	var transactions []interface{}
	if pbBlockInfo.TransactionData != nil {
		for i, txData := range pbBlockInfo.TransactionData {
			rawTx := convertPBTransactionDataToRawTransaction(
				txData,
				fmt.Sprintf("%x", pbBlockInfo.Hash),
				pbBlockInfo.Slot,
				uint64(i),
			)
			transactions = append(transactions, rawTx)
		}
	}
	rawBlock["transactions"] = transactions

	// Set default values for Ethereum-compatible fields
	rawBlock["nonce"] = "0x0"
	rawBlock["sha3Uncles"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["mixHash"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["stateRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["transactionsRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["receiptsRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["logsBloom"] = "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
	rawBlock["difficulty"] = "0x0"
	rawBlock["totalDifficulty"] = "0x0"
	rawBlock["size"] = "0x0"
	rawBlock["extraData"] = "0x" //nolint:goconst // protocol literal
	rawBlock["gasLimit"] = "0x0"
	rawBlock["gasUsed"] = "0x0"
	rawBlock["baseFeePerGas"] = "0x0"
	rawBlock["withdrawalsRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"

	return rawBlock
}

// convertPBTransactionDataToRawTransaction converts a protobuf TransactionData to common.RawTransaction format
func convertPBTransactionDataToRawTransaction(pbTransactionData *pb.TransactionData, blockHash string, blockNumber, txIndex uint64) map[string]interface{} {
	rawTransaction := make(map[string]interface{})
	// Convert transaction hash
	rawTransaction["hash"] = pbTransactionData.TxHash

	// Convert addresses
	rawTransaction["from"] = pbTransactionData.Sender
	rawTransaction["to"] = pbTransactionData.Recipient

	// Convert amount to hex format
	rawTransaction["value"] = pbTransactionData.Amount

	// Convert nonce to hex format
	rawTransaction["nonce"] = fmt.Sprintf("%x", pbTransactionData.Nonce)

	rawTransaction["transactionTimestamp"] = fmt.Sprintf("%x", pbTransactionData.Timestamp)

	rawTransaction["textData"] = pbTransactionData.TextData

	rawTransaction["extra_info"] = pbTransactionData.ExtraInfo
	// Block information
	rawTransaction["blockHash"] = blockHash
	rawTransaction["blockNumber"] = fmt.Sprintf("%x", blockNumber)
	rawTransaction["transactionIndex"] = txIndex
	status := uint64(pbTransactionData.Status)
	rawTransaction["status"] = &status

	// Set default values for Ethereum-compatible fields
	rawTransaction["gas"] = "0x0"
	rawTransaction["gasPrice"] = "0x0"
	rawTransaction["input"] = "0x"
	rawTransaction["type"] = "0x0"
	rawTransaction["r"] = "0x0"
	rawTransaction["s"] = "0x0"
	rawTransaction["v"] = "0x0"
	rawTransaction["maxFeePerGas"] = "0x0"
	rawTransaction["maxPriorityFeePerGas"] = "0x0"
	rawTransaction["maxFeePerBlobGas"] = "0x0"
	rawTransaction["blobVersionedHashes"] = []string{}
	rawTransaction["accessList"] = nil
	rawTransaction["authorizationList"] = nil

	return rawTransaction
}
