package blockchain

import (
	"context"
	"dong-service/config"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/utils"
	"fmt"
	"math/big"
	"time"

	"github.com/btcsuite/btcutil/base58"
	mmnClient "github.com/mezonai/mmn-sdk/go-sdk/client"
)

const (
	TypeTx   = 1
	DECIMALS = 6
)

type BlockchainService struct {
	mmnClient *mmnClient.MmnClient
	rpcURL    string
}

func NewBlockchainService(cfg *config.Config) (*BlockchainService, error) {
	var client *mmnClient.MmnClient

	if cfg.Blockchain.RPCURL != "" {
		if mmnClientInstance, err := mmnClient.NewClient(mmnClient.Config{Endpoint: cfg.Blockchain.RPCURL, UseTLS: cfg.Blockchain.UseTLS}); err != nil {
			logger.Error().Err(err).Msg("failed to init mmn client")
		} else {
			client = mmnClientInstance
		}
	}

	return &BlockchainService{
		mmnClient: client,
		rpcURL:    cfg.Blockchain.RPCURL,
	}, nil
}

func (s *BlockchainService) Transfer(fromAddress, toAddress string, amount int64, privateKeyBs58, textData, extraInfo string) (string, error) {
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
		Type:      int(TypeTx),
		Sender:    fromAddress,
		Recipient: toAddress,
		Amount:    mmnClient.Uint256FromString(scaleAmount),
		Timestamp: uint64(time.Now().Unix()),
		TextData:  textData,
		Nonce:     nonceResp,
		ExtraInfo: extraInfo,
	}
	privateKey := base58.Decode(privateKeyBs58)
	signature, err := mmnClient.SignTx(txMsg, []byte(fromAddress), privateKey)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to sign transaction")
		return "", fmt.Errorf("failed to sign transaction: %w", err)
	}

	signedTx := &mmnClient.SignedTx{
		Tx:  txMsg,
		Sig: signature.Sig,
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

func (s *BlockchainService) GetTransaction(txHash string) (*mmnClient.TxInfo, error) {
	if s.mmnClient == nil {
		return nil, fmt.Errorf("mmn client not initialized")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	txInfo, err := s.mmnClient.GetTxByHash(ctx, txHash)
	if err != nil {
		logger.Error().Err(err).Str("tx_hash", txHash).Msg("Failed to get transaction by hash")
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	return &txInfo, nil
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

func (s *BlockchainService) TransferMoney(encryptedPrivateKey, fromAddress, toAddress string, amount int64) (string, error) {
	privateKey, err := utils.DecryptPrivateKey(encryptedPrivateKey)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to decrypt private key")
		return "", err
	} else {
		txHash, err := s.Transfer(
			fromAddress,
			toAddress,
			amount,
			privateKey,
			constants.TextDataLuckyMoney,
			constants.ExtraInfoLuckyMoney,
		)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to transfer funds")
			return "", err
		} else {
			// TODO: use function GetTxByHash to get status
			logger.Info().
				Str("tx_hash", txHash).
				Int64("amount", amount).
				Msg("Successfully transferred remaining balance to owner")
			return txHash, nil
		}
	}
}

func (s *BlockchainService) CheckTransactionStatus(txHash string) (int32, error) {
	maxRetries := 3
	retryDelay := 500 * time.Millisecond

	for attempt := 1; attempt <= maxRetries; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

		txResp, err := s.mmnClient.GetTxByHash(ctx, txHash)
		cancel()

		if err != nil {
			logger.Error().
				Err(err).
				Str("tx_hash", txHash).
				Int("attempt", attempt).
				Msg("Failed to get transaction by hash")

			if attempt < maxRetries {
				time.Sleep(retryDelay)
				continue
			}
			return 0, fmt.Errorf("failed to get transaction after %d attempts: %w", maxRetries, err)
		}

		status := int32(txResp.Status)

		// Status 2 = COMPLETED
		if status == constants.TxStatusFinalized {
			logger.Info().
				Str("tx_hash", txHash).
				Msg("Transaction completed successfully")
			return status, nil
		}

		// Status 3 = FAILED
		if status == (constants.TxStatusFinalized) {
			logger.Error().
				Str("tx_hash", txHash).
				Msg("Transaction failed")
			return status, fmt.Errorf("transaction failed with status %d", status)
		}

		// Status 0 or 1 = PENDING or CONFIRMED - retry if we have attempts left
		if status == constants.TxStatusPending || status == constants.TxStatusConfirmed {
			if attempt < maxRetries {
				time.Sleep(retryDelay)
				continue
			}
			return status, fmt.Errorf("transaction still pending/confirming after %d attempts (status: %d)", maxRetries, status)
		}
	}

	return 0, fmt.Errorf("failed to check transaction status after %d attempts", maxRetries)
}
