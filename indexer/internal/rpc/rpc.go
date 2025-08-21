package rpc

import (
	"context"
	"fmt"
	"math/big"
	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/internal/common"
	pb "github.com/thirdweb-dev/indexer/proto"
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
	Blocks   int
	Logs     int
	Traces   int
	Receipts int
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
	blockService          *BlockService
	chainID               *big.Int
	blocksPerRequest      BlocksPerRequestConfig
}

func Initialize() (IRPCClient, error) {
	blockService, err := NewBlockService("localhost:9001")
	if err != nil {
		log.Warn().Err(err).Msg("Failed to initialize MMN BlockService, continuing without it")
	}

	rpc := &Client{
		blockService:     blockService,
		blocksPerRequest: GetBlockPerRequestConfig(),
	}
	
	rpc.chainID = big.NewInt(1337)
	return IRPCClient(rpc), nil
}

func InitializeSimpleRPCWithUrl(url string) (IRPCClient, error) {
	blockService, err := NewBlockService("localhost:9001")
	if err != nil {
		log.Warn().Err(err).Msg("Failed to initialize MMN BlockService, continuing without it")
	}
	
	rpc := &Client{
		blockService: blockService,
	}
	
	rpc.chainID = big.NewInt(1337)
	return IRPCClient(rpc), nil
}

func (rpc *Client) GetFullBlocks(ctx context.Context, blockNumbers []*big.Int) []GetFullBlockResult {
    if rpc.blockService == nil {
        return []GetFullBlockResult{{
            Error: fmt.Errorf("MMN BlockService not available"),
        }}
    }

    nums := make([]uint64, len(blockNumbers))
    for i, n := range blockNumbers {
        nums[i] = n.Uint64()
    }

    res, err := rpc.blockService.GetBlockByNumber(ctx, nums)
    if err != nil {
        return []GetFullBlockResult{{
            Error: fmt.Errorf("failed to get full block: %v", err),
        }}
    }

    rawBlocks := make([]RPCFetchBatchResult[*big.Int, common.RawBlock], len(blockNumbers))
    
    for i, blk := range res.Blocks {
        if blk != nil {
            rawBlock := convertPBBlockToRawBlock(blk)
            rawBlocks[i] = RPCFetchBatchResult[*big.Int, common.RawBlock]{
                Key:    blockNumbers[i],
                Result: rawBlock,
                Error:  nil,
            }
        } else {
            rawBlocks[i] = RPCFetchBatchResult[*big.Int, common.RawBlock]{
                Key:    blockNumbers[i],
                Result: nil,
                Error:  fmt.Errorf("block not found"),
            }
        }
    }
    
    return SerializeFullBlocks(rpc.chainID, rawBlocks, nil, nil, nil)
}

func (rpc *Client) GetLatestBlockNumber(ctx context.Context) (*big.Int, error) {
	if rpc.blockService == nil {
		return nil, fmt.Errorf("MMN BlockService not available")
	}
	
	res, err := rpc.blockService.GetBlockNumber(ctx)
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
	return "mmn-grpc://localhost:9001"
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
	if rpc.blockService != nil {
		rpc.blockService.Close()
	}
}

func (rpc *Client) HasCode(ctx context.Context, address string) (bool, error) {
	return false, nil
}


func (rpc *Client) GetBlocks(ctx context.Context, blockNumbers []*big.Int) []GetBlocksResult {
	fullBlocks := rpc.GetFullBlocks(ctx, blockNumbers)
	
	results := make([]GetBlocksResult, len(fullBlocks))
	for i, fullBlock := range fullBlocks {
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
	for i, _ := range txHashes {
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
				pbBlock.Timestamp, 
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
	rawBlock["extraData"] = "0x"
	rawBlock["gasLimit"] = "0x0"
	rawBlock["gasUsed"] = "0x0"
	rawBlock["baseFeePerGas"] = "0x0"
	rawBlock["withdrawalsRoot"] = "0x0000000000000000000000000000000000000000000000000000000000000000"
	
	return rawBlock
}

// convertPBTransactionDataToRawTransaction converts a protobuf TransactionData to common.RawTransaction format
func convertPBTransactionDataToRawTransaction(pbTransactionData *pb.TransactionData, blockHash string, blockNumber uint64, blockTimestamp uint64, txIndex uint64) map[string]interface{} {
	rawTransaction := make(map[string]interface{})
	// Convert transaction hash
	rawTransaction["hash"] = pbTransactionData.TxHash
	
	// Convert addresses
	rawTransaction["from"] = pbTransactionData.Sender
	rawTransaction["to"] = pbTransactionData.Recipient
	
	// Convert amount to hex format
	rawTransaction["value"] = fmt.Sprintf("%x", pbTransactionData.Amount)
	
	// Convert nonce to hex format
	rawTransaction["nonce"] = fmt.Sprintf("%x", pbTransactionData.Nonce)
	
	// Block information
	rawTransaction["blockHash"] = blockHash
	fmt.Println("blockHashLen", len(blockHash))
	rawTransaction["blockNumber"] = fmt.Sprintf("%x", blockNumber)
	rawTransaction["transactionIndex"] = txIndex
	status := getStatus(pbTransactionData.Status)
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
func getStatus(status pb.TransactionData_Status) uint64 {
	switch status {
	case pb.TransactionData_PENDING:
		return 0
	case pb.TransactionData_CONFIRMED:
		return 1
	case pb.TransactionData_FINALIZED:
		return 2
	case pb.TransactionData_FAILED:
		return 3
	}
	return 4
}