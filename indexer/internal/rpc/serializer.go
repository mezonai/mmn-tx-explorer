package rpc

import (
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/rs/zerolog/log"
)

func SerializeFullBlocks(chainID *big.Int, blocks []RPCFetchBatchResult[*big.Int, common.RawBlock], logs []RPCFetchBatchResult[*big.Int, common.RawLogs], traces []RPCFetchBatchResult[*big.Int, common.RawTraces], receipts []RPCFetchBatchResult[*big.Int, common.RawReceipts]) []GetFullBlockResult {
	if blocks == nil {
		return []GetFullBlockResult{}
	}
	results := make([]GetFullBlockResult, 0, len(blocks))

	for _, rawBlockData := range blocks {
		result := GetFullBlockResult{
			BlockNumber: rawBlockData.Key,
		}
		if rawBlockData.Result == nil {
			log.Warn().Err(rawBlockData.Error).Msgf("Received a nil block result for block %s.", rawBlockData.Key.String())
			result.Error = fmt.Errorf("received a nil block result from RPC. %v", rawBlockData.Error)
			results = append(results, result)
			continue
		}

		if rawBlockData.Error != nil {
			result.Error = rawBlockData.Error
			results = append(results, result)
			continue
		}

		result.Data.Block = serializeBlock(chainID, rawBlockData.Result)
		result.Data.Transactions = serializeTransactions(chainID, rawBlockData.Result["transactions"].([]interface{}), nil)

		results = append(results, result)
	}

	return results
}

func SerializeBlocks(chainID *big.Int, blocks []RPCFetchBatchResult[*big.Int, common.RawBlock]) []GetBlocksResult {
	results := make([]GetBlocksResult, 0, len(blocks))

	for _, rawBlock := range blocks {
		result := GetBlocksResult{
			BlockNumber: rawBlock.Key,
		}
		if rawBlock.Result == nil {
			log.Warn().Msgf("Received a nil block result for block %s.", rawBlock.Key.String())
			result.Error = fmt.Errorf("received a nil block result from RPC")
			results = append(results, result)
			continue
		}

		if rawBlock.Error != nil {
			result.Error = rawBlock.Error
			results = append(results, result)
			continue
		}

		result.Data = serializeBlock(chainID, rawBlock.Result)
		results = append(results, result)
	}

	return results
}

func serializeBlock(chainID *big.Int, block common.RawBlock) common.Block {
	return common.Block{
		ChainID:          chainID,
		Number:           hexToBigInt(block["number"]),
		Hash:             interfaceToString(block["hash"]),
		ParentHash:       interfaceToString(block["parentHash"]),
		Timestamp:        hexToTime(block["timestamp"]),
		TransactionCount: uint64(len(block["transactions"].([]interface{}))),
	}
}

func serializeTransactions(chainID *big.Int, transactions []interface{}, receipts *common.RawReceipts) []common.Transaction {
	if len(transactions) == 0 {
		return []common.Transaction{}
	}
	receiptMap := make(map[string]*common.RawReceipt)
	if receipts != nil && len(*receipts) > 0 {
		for _, receipt := range *receipts {
			txHash := interfaceToString(receipt["transactionHash"])
			if txHash != "" {
				receiptMap[txHash] = &receipt
			}
		}
	}
	serializedTransactions := make([]common.Transaction, 0, len(transactions))
	for _, rawTx := range transactions {
		tx, ok := rawTx.(map[string]interface{})
		if !ok {
			log.Debug().Msgf("Failed to serialize transaction: %v", rawTx)
			continue
		}
		serializedTransactions = append(serializedTransactions, serializeTransaction(chainID, tx))
	}
	return serializedTransactions
}

func serializeTransaction(chainID *big.Int, tx map[string]interface{}) common.Transaction {
	return common.Transaction{
		ChainID:              chainID,
		Hash:                 interfaceToString(tx["hash"]),
		Nonce:                hexToUint64(tx["nonce"]),
		BlockHash:            interfaceToString(tx["blockHash"]),
		BlockNumber:          hexToBigInt(tx["blockNumber"]),
		FromAddress:          interfaceToString(tx["from"]),
		ToAddress:            interfaceToString(tx["to"]),
		TransactionTimestamp: hexToTime(tx["transactionTimestamp"]),
		Value:                interfaceToString(tx["value"]),
		TransactionType:      uint8(hexToUint64(tx["type"])),
		Status:               tx["status"].(*uint64),
		TextData:             interfaceToString(tx["textData"]),
		ExtraInfo:            interfaceToString(tx["extra_info"]),
	}
}

// ExtractFunctionSelector extracts the function selector (first 4 bytes) from a transaction input.
func ExtractFunctionSelector(s string) string {
	if len(s) < 10 {
		return ""
	}
	return s[0:10]
}

func hexToBigInt(hex interface{}) *big.Int {
	hexString := interfaceToString(hex)
	if hexString == "" {
		return new(big.Int)
	}
	v, _ := new(big.Int).SetString(hexString, 16)
	return v
}

func hexToTime(hex interface{}) time.Time {
	unixTime := hexToUint64(hex)
	// Detect units by magnitude: ns(~1e18), ms(~1e12), s(~1e9)
	switch {
	case unixTime >= 1_000_000_000_000_000: // nanoseconds
		seconds := unixTime / 1_000_000_000
		nanoRemainder := unixTime % 1_000_000_000
		return time.Unix(int64(seconds), int64(nanoRemainder))
	case unixTime >= 1_000_000_000_000: // milliseconds
		seconds := unixTime / 1_000
		milliRemainder := unixTime % 1_000
		return time.Unix(int64(seconds), int64(milliRemainder)*int64(time.Millisecond))
	default: // seconds
		return time.Unix(int64(unixTime), 0)
	}
}

func hexToUint64(hex interface{}) uint64 {
	hexString := interfaceToString(hex)
	if hexString == "" {
		return 0
	}
	v, _ := strconv.ParseUint(hexString, 16, 64)
	return v
}

func interfaceToString(value interface{}) string {
	if value == nil {
		return ""
	}
	res, ok := value.(string)
	if !ok {
		return ""
	}
	return res
}

func SerializeTransactions(chainID *big.Int, transactions []RPCFetchBatchResult[string, common.RawTransaction]) []GetTransactionsResult {
	results := make([]GetTransactionsResult, 0, len(transactions))
	for _, transaction := range transactions {
		result := GetTransactionsResult{
			Error: transaction.Error,
			Data:  serializeTransaction(chainID, transaction.Result),
		}
		results = append(results, result)
	}
	return results
}
