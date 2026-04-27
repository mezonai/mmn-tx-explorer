package blockchain

import (
	"context"
	"dong-service/config"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/utils"
	"fmt"
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

func (s *BlockchainService) transfer(fromAddress, toAddress, amountStr, privateKeyBs58, textData, extraInfo string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	nonceResp, err := s.mmnClient.GetCurrentNonce(ctx, fromAddress, "pending")
	if err != nil {
		logger.Error().Err(err).Str("from", fromAddress).Msg("Failed to get current nonce")
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	txMsg := &mmnClient.Tx{
		Type:      int(TypeTx),
		Sender:    fromAddress,
		Recipient: toAddress,
		Amount:    mmnClient.Uint256FromString(amountStr),
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
		Str("amount", amountStr).
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

func (s *BlockchainService) TransferMoney(encryptedPrivateKey, fromAddress, toAddress, amountStr, textData, extraInfoType string) (string, error) {
	privateKey, err := utils.DecryptPrivateKey(encryptedPrivateKey)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to decrypt private key")
		return "", err
	}

	txHash, err := s.transfer(
		fromAddress,
		toAddress,
		amountStr,
		privateKey,
		textData,
		extraInfoType,
	)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to transfer funds")
		return "", err
	}

	// Check transaction status to ensure it's finalized
	_, err = s.CheckTransactionStatus(txHash)
	if err != nil {
		logger.Error().Err(err).Str("tx_hash", txHash).Msg("Transaction status check failed")
		return txHash, err
	}

	logger.Info().
		Str("tx_hash", txHash).
		Str("amount", amountStr).
		Msg("Successfully transferred funds and confirmed status")

	return txHash, nil
}

// CheckTransactionStatus checks the transaction status with retry logic
// Retries 3 times with 0.5s delay between attempts
// Returns status and error
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
			return constants.TxStatusPending, fmt.Errorf("failed to get transaction after %d attempts: %w", maxRetries, err)
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
		if status == (constants.TxStatusFailed) {
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

	return constants.TxStatusPending, fmt.Errorf("failed to check transaction status after %d attempts", maxRetries)
}
