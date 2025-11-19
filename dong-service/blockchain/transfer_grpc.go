package blockchain

import (
	"context"
	"crypto/ed25519"
	"dong-service/config"
	"dong-service/logger"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	mmnClient "github.com/mezonai/mmn-sdk/go-sdk/client"

	"github.com/btcsuite/btcutil/base58"
)

const (
	TYPE_TX = 1
	DECIMALS = 6
)

type BlockchainService struct {
	mmnClient *mmnClient.MmnClient
	rpcURL    string
}

func NewBlockchainService(config *config.Config) (*BlockchainService, error) {
	var client *mmnClient.MmnClient

	if config.Blockchain.RPCURL != "" {
		if mmnClientInstance, err := mmnClient.NewClient(mmnClient.Config{Endpoint: config.Blockchain.RPCURL, UseTLS: config.Blockchain.UseTls}); err != nil {
			logger.Error().Err(err).Msg("failed to init mmn client")
		} else {
			client = mmnClientInstance
		}
	}

	return &BlockchainService{
		mmnClient:  client,
		rpcURL:    config.Blockchain.RPCURL,
	}, nil
}

func (s *BlockchainService) Transfer(fromAddress, toAddress string, amount int64, privateKeyHex, textData, extraInfo string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	nonceResp, err := s.mmnClient.GetCurrentNonce(ctx, fromAddress, "pending")
	if err != nil {
		logger.Error().Err(err).Str("from", fromAddress).Msg("Failed to get current nonce")
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	scaleAmount, err := scaleAmountToDecimals(amount)
	if err != nil {
		logger.Error().Err(err).Str("from", fromAddress).Msg("Failed to scale amount")
		return "", fmt.Errorf("failed to scale amount: %w", err)
	}

	txMsg := &mmnClient.Tx{
		Type:      int(TYPE_TX),
		Sender:    fromAddress,
		Recipient: toAddress,
		Amount:    mmnClient.Uint256FromString(scaleAmount),
		Timestamp: uint64(time.Now().Unix()),
		TextData:  textData,
		Nonce:     nonceResp,
		ExtraInfo: extraInfo,
		ZkProof:   "",
		ZkPub:     "",
	}
	signature, err := s.signTransaction(txMsg, privateKeyHex)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to sign transaction")
		return "", fmt.Errorf("failed to sign transaction: %w", err)
	}

	signedTx := &mmnClient.SignedTx{
		Tx:     txMsg,
		Sig: signature,
	}

	resp, err := s.mmnClient.AddTx(ctx, *signedTx)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to submit transaction")
		return "", fmt.Errorf("failed to submit transaction: %w", err)
	}

	if !resp.Ok {
		logger.Error().Str("error", resp.Error).Msg("Transaction submission failed")
		return "", fmt.Errorf("transaction failed: %s", resp.Error)
	}

	logger.Info().
		Str("tx_hash", resp.TxHash).
		Str("from", fromAddress).
		Str("to", toAddress).
		Int64("amount", amount).
		Msg("Transaction submitted successfully")

	return resp.TxHash, nil
}

func (s *BlockchainService) signTransaction(txMsg *mmnClient.Tx, privateKeyHex string) (string, error) {
	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		return "", fmt.Errorf("invalid private key hex: %w", err)
	}
	var privateKey ed25519.PrivateKey

	switch len(privateKeyBytes) {
	case ed25519.SeedSize: // 32 bytes - seed
		privateKey = ed25519.NewKeyFromSeed(privateKeyBytes)
	case ed25519.PrivateKeySize: // 64 bytes - full private key
		privateKey = ed25519.PrivateKey(privateKeyBytes)
	default:
		return "", fmt.Errorf("unsupported private key length: expected 32, 48 (DER), or 64, got %d", len(privateKeyBytes))
	}

	message := s.serializeTransactionForSigning(txMsg)
	signature := ed25519.Sign(privateKey, message)
	return base58.Encode(signature), nil
}

func (s *BlockchainService) serializeTransactionForSigning(txMsg *mmnClient.Tx) []byte {
	message := fmt.Sprintf(
		"%d|%s|%s|%s|%s|%d|%s",
		txMsg.Type,
		txMsg.Sender,
		txMsg.Recipient,
		txMsg.Amount,
		txMsg.TextData,
		txMsg.Nonce,
		txMsg.ExtraInfo,
	)
	return []byte(message)
}

func (s *BlockchainService) Close() error {
	if s.mmnClient != nil {
		return s.mmnClient.Close()
	}
	return nil
}

func scaleAmountToDecimals(originalAmount interface{}) (string, error) {
	scaledAmount := new(big.Int)
	decimals := DECIMALS
	switch v := originalAmount.(type) {
	case string:
		if _, ok := scaledAmount.SetString(v, 10); !ok {
			return "", fmt.Errorf("invalid number string: %s", v)
		}
	case int:
		scaledAmount.SetInt64(int64(v))
	case int64:
		scaledAmount.SetInt64(v)
	default:
		return "", fmt.Errorf("unsupported type: %T", v)
	}
	multiplier := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	scaledAmount.Mul(scaledAmount, multiplier)
	return scaledAmount.String(), nil
}
