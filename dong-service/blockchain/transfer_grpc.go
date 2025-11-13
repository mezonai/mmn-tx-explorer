package blockchain

import (
	"context"
	"crypto/ed25519"
	"dong-service/logger"
	pb "dong-service/proto"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/btcsuite/btcutil/base58"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const (
	TYPE_TX_FAUCET = 1
	TEXT_DATA = "Red envelope fund"
	EXTRA_INFO = `"type":"red-envelope-fund"}`
	DECIMALS = 6
)

type BlockchainService struct {
	conn      *grpc.ClientConn
	txClient  pb.TxServiceClient
	accClient pb.AccountServiceClient
	rpcURL    string
}

func NewBlockchainService(rpcURL string) (*BlockchainService, error) {
	conn, err := grpc.NewClient(rpcURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to blockchain RPC: %w", err)
	}

	return &BlockchainService{
		conn:      conn,
		txClient:  pb.NewTxServiceClient(conn),
		accClient: pb.NewAccountServiceClient(conn),
		rpcURL:    rpcURL,
	}, nil
}

func (s *BlockchainService) Transfer(fromAddress, toAddress string, amount int64, privateKeyHex string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	nonceResp, err := s.accClient.GetCurrentNonce(ctx, &pb.GetCurrentNonceRequest{
		Address: fromAddress,
		Tag:     "pending",
	})
	if err != nil {
		logger.Error().Err(err).Str("from", fromAddress).Msg("Failed to get current nonce")
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	if nonceResp.Error != "" {
		logger.Error().Str("error", nonceResp.Error).Str("from", fromAddress).Msg("Error from GetCurrentNonce")
		return "", fmt.Errorf("nonce error: %s", nonceResp.Error)
	}
	scaleAmount, err := scaleAmountToDecimals(amount)
	if err != nil {
		logger.Error().Err(err).Str("from", fromAddress).Msg("Failed to scale amount")
		return "", fmt.Errorf("failed to scale amount: %w", err)
	}

	txMsg := &pb.TxMsg{
		Type:      int32(TYPE_TX_FAUCET),
		Sender:    fromAddress,
		Recipient: toAddress,
		Amount:    scaleAmount,
		Timestamp: uint64(time.Now().Unix()),
		TextData:  TEXT_DATA,
		Nonce:     nonceResp.Nonce,
		ExtraInfo: EXTRA_INFO,
		ZkProof:   "",
		ZkPub:     "",
	}
	signature, err := s.signTransaction(txMsg, privateKeyHex)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to sign transaction")
		return "", fmt.Errorf("failed to sign transaction: %w", err)
	}

	signedTx := &pb.SignedTxMsg{
		TxMsg:     txMsg,
		Signature: signature,
	}

	resp, err := s.txClient.AddTx(ctx, signedTx)
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

func (s *BlockchainService) signTransaction(txMsg *pb.TxMsg, privateKeyHex string) (string, error) {
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

func (s *BlockchainService) serializeTransactionForSigning(txMsg *pb.TxMsg) []byte {
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

// func (s *BlockchainService) GetBalance(address string) (*big.Int, error) {
// 	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
// 	defer cancel()

// 	resp, err := s.accClient.GetAccount(ctx, &pb.GetAccountRequest{
// 		Address: address,
// 	})
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get account: %w", err)
// 	}

// 	balance := new(big.Int)
// 	balance.SetString(resp.Balance, 10)
// 	return balance, nil
// }

func (s *BlockchainService) Close() error {
	if s.conn != nil {
		return s.conn.Close()
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
