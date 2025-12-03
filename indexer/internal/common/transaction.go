package common

import (
	"math/big"
	"time"
)

const (
	TxTypeTransferByZk         = 0
	TxTypeTransferByKey        = 1
	TxTypeDonationCampaignFeed = 2
)

type RawTransaction = map[string]interface{}

type Transaction struct {
	ChainID                  *big.Int                 `json:"chain_id" ch:"chain_id" swaggertype:"string"`
	Hash                     string                   `json:"hash" ch:"hash"`
	Nonce                    uint64                   `json:"nonce" ch:"nonce"`
	BlockHash                string                   `json:"block_hash" ch:"block_hash"`
	BlockNumber              *big.Int                 `json:"block_number" ch:"block_number" swaggertype:"string"`
	FromAddress              string                   `json:"from_address" ch:"from_address"`
	ToAddress                string                   `json:"to_address" ch:"to_address"`
	TransactionTimestamp     time.Time                `json:"transaction_timestamp" ch:"transaction_timestamp"`
	Value                    string                   `json:"value" ch:"value" swaggertype:"string"`
	TransactionType          int32                    `json:"transaction_type" ch:"transaction_type"`
	Status                   *uint64                  `json:"status" ch:"status"`
	TextData                 string                   `json:"text_data" ch:"text_data"`
	ExtraInfo                string                   `json:"extra_info" ch:"extra_info"`
	TransactionExtraInfoType TransactionExtraInfoType `json:"transaction_extra_info_type" ch:"transaction_extra_info_type"`
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

type BaseTransactionModel struct {
	ChainID              string  `json:"chain_id"`
	Hash                 string  `json:"hash"`
	Nonce                uint64  `json:"nonce"`
	BlockHash            string  `json:"block_hash"`
	BlockNumber          uint64  `json:"block_number"`
	FromAddress          string  `json:"from_address"`
	ToAddress            string  `json:"to_address"`
	Value                string  `json:"value"`
	TransactionType      int32   `json:"transaction_type"`
	Status               *uint64 `json:"status"`
	TransactionTimestamp uint64  `json:"transaction_timestamp"`
	TextData             string  `json:"text_data"`
}

// TransactionModel represents a simplified Transaction structure for Swagger documentation
type TransactionModel struct {
	BaseTransactionModel
	ExtraInfo string `json:"extra_info"`
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

func (t *Transaction) Serialize() TransactionModel {
	return TransactionModel{
		BaseTransactionModel: BaseTransactionModel{
			ChainID:              t.ChainID.String(),
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
		},
		ExtraInfo: t.ExtraInfo,
	}
}

func (t *Transaction) SerializeInternal() BaseTransactionModel {
	return BaseTransactionModel{
		ChainID:              t.ChainID.String(),
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
