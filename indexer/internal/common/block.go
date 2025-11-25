package common

import (
	"math/big"
	"time"
)

type Block struct {
	ChainID          *big.Int  `json:"chain_id" ch:"chain_id"`
	Number           *big.Int  `json:"block_number" ch:"block_number"`
	Hash             string    `json:"hash" ch:"hash"`
	ParentHash       string    `json:"parent_hash" ch:"parent_hash"`
	Timestamp        time.Time `json:"block_timestamp" ch:"block_timestamp"`
	TransactionCount uint64    `json:"transaction_count" ch:"transaction_count"`
}

// BlockModel represents a simplified Block structure for Swagger documentation
type BlockModel struct {
	ChainID          string `json:"chain_id"`
	BlockNumber      uint64 `json:"block_number"`
	BlockHash        string `json:"block_hash"`
	ParentHash       string `json:"parent_hash"`
	BlockTimestamp   uint64 `json:"block_timestamp"`
	TransactionCount uint64 `json:"transaction_count"`
}

type BlockData struct {
	Block        Block
	Transactions []Transaction
	Logs         []Log
	Traces       []Trace
}

type BlockHeader struct {
	Number     *big.Int `json:"number"`
	Hash       string   `json:"hash"`
	ParentHash string   `json:"parent_hash"`
}

type RawBlock = map[string]interface{}

func (b *Block) Serialize() BlockModel {
	return BlockModel{
		ChainID:          b.ChainID.String(),
		BlockNumber:      b.Number.Uint64(),
		BlockHash:        b.Hash,
		ParentHash:       b.ParentHash,
		BlockTimestamp:   uint64(b.Timestamp.Unix()),
		TransactionCount: b.TransactionCount,
	}
}
