package common

import (
	"math/big"
	"time"
)

type RawTransaction = map[string]interface{}

type Transaction struct {
	ChainId              *big.Int  `json:"chain_id" ch:"chain_id" swaggertype:"string"`
	Hash                 string    `json:"hash" ch:"hash"`
	Nonce                uint64    `json:"nonce" ch:"nonce"`
	BlockHash            string    `json:"block_hash" ch:"block_hash"`
	BlockNumber          *big.Int  `json:"block_number" ch:"block_number" swaggertype:"string"`
	FromAddress          string    `json:"from_address" ch:"from_address"`
	ToAddress            string    `json:"to_address" ch:"to_address"`
	TransactionTimestamp time.Time `json:"transaction_timestamp" ch:"transaction_timestamp"`
	Value                string    `json:"value" ch:"value" swaggertype:"string"`
	TransactionType      uint8     `json:"transaction_type" ch:"transaction_type"`
	Status               *uint64   `json:"status" ch:"status"`
	TextData             string    `json:"text_data" ch:"text_data"`
	ExtraInfo            string    `json:"extra_info" ch:"extra_info"`
}

type DecodedTransactionData struct {
	Name      string                 `json:"name"`
	Signature string                 `json:"signature"`
	Inputs    map[string]interface{} `json:"inputs"`
}

type DecodedTransaction struct {
	Transaction
	Decoded DecodedTransactionData `json:"decoded"`
}

// TransactionModel represents a simplified Transaction structure for Swagger documentation
type TransactionModel struct {
	ChainId              string  `json:"chain_id"`
	Hash                 string  `json:"hash"`
	Nonce                uint64  `json:"nonce"`
	BlockHash            string  `json:"block_hash"`
	BlockNumber          uint64  `json:"block_number"`
	FromAddress          string  `json:"from_address"`
	ToAddress            string  `json:"to_address"`
	Value                string  `json:"value"`
	TransactionType      uint8   `json:"transaction_type"`
	Status               *uint64 `json:"status"`
	TransactionTimestamp uint64  `json:"transaction_timestamp"`
	TextData             string  `json:"text_data"`
	ExtraInfo			 string  `json:"extra_info"`
}

type DecodedTransactionDataModel struct {
	Name      string                 `json:"name"`
	Signature string                 `json:"signature"`
	Inputs    map[string]interface{} `json:"inputs"`
}

type DecodedTransactionModel struct {
	TransactionModel
	Decoded DecodedTransactionDataModel `json:"decoded"`
}

// InternalTransactionModel represents a Transaction structure for internal endpoints without extra_info
type InternalTransactionModel struct {
	ChainId              string  `json:"chain_id"`
	Hash                 string  `json:"hash"`
	Nonce                uint64  `json:"nonce"`
	BlockHash            string  `json:"block_hash"`
	BlockNumber          uint64  `json:"block_number"`
	FromAddress          string  `json:"from_address"`
	ToAddress            string  `json:"to_address"`
	Value                string  `json:"value"`
	TransactionType      uint8   `json:"transaction_type"`
	Status               *uint64 `json:"status"`
	TransactionTimestamp uint64  `json:"transaction_timestamp"`
	TextData             string  `json:"text_data"`
}

func (t *Transaction) Serialize() TransactionModel {
	return TransactionModel{
		ChainId:              t.ChainId.String(),
		Hash:                 t.Hash,
		Nonce:                t.Nonce,
		BlockHash:            t.BlockHash,
		BlockNumber:          t.BlockNumber.Uint64(),
		FromAddress:          t.FromAddress,
		ToAddress:            t.ToAddress,
		Value:                t.Value,
		TransactionType:      t.TransactionType,
		Status:               t.Status,
		TransactionTimestamp: uint64(t.TransactionTimestamp.Unix()),
		TextData:             t.TextData,
		ExtraInfo: 			  t.ExtraInfo,
	}
}

func (t *Transaction) SerializeInternal() InternalTransactionModel {
	return InternalTransactionModel{
		ChainId:              t.ChainId.String(),
		Hash:                 t.Hash,
		Nonce:                t.Nonce,
		BlockHash:            t.BlockHash,
		BlockNumber:          t.BlockNumber.Uint64(),
		FromAddress:          t.FromAddress,
		ToAddress:            t.ToAddress,
		Value:                t.Value,
		TransactionType:      t.TransactionType,
		Status:               t.Status,
		TransactionTimestamp: uint64(t.TransactionTimestamp.Unix()),
		TextData:             t.TextData,
	}
}

func (t *DecodedTransaction) Serialize() DecodedTransactionModel {
	// Convert big numbers to strings in the decoded inputs
	decodedInputs := ConvertBigNumbersToString(t.Decoded.Inputs).(map[string]interface{})

	return DecodedTransactionModel{
		TransactionModel: t.Transaction.Serialize(),
		Decoded: DecodedTransactionDataModel{
			Name:      t.Decoded.Name,
			Signature: t.Decoded.Signature,
			Inputs:    decodedInputs,
		},
	}
}
