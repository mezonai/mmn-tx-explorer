package bridge

import (
	"context"
	"crypto/ecdsa"
	"dong-service/contracts"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/rs/zerolog/log"
)

type WMezonBridge struct {
	client          *ethclient.Client
	contract        *contracts.WMEZON
	contractAddress common.Address
	privateKey      *ecdsa.PrivateKey
	fromAddress     common.Address
	chainID         *big.Int
}

func NewWMezonBridge(contractAddress, rpcURL string) (*WMezonBridge, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum client: %w", err)
	}

	chainID, err := client.ChainID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	contractAddr := common.HexToAddress(contractAddress)
	contract, err := contracts.NewWMEZON(contractAddr, client)
	if err != nil {
		return nil, fmt.Errorf("failed to load contract: %w", err)
	}

	log.Info().
		Str("contract", contractAddr.Hex()).
		Str("chainID", chainID.String()).
		Msg("WMezonBridge initialized")

	return &WMezonBridge{
		client:          client,
		contract:        contract,
		contractAddress: contractAddr,
		chainID:         chainID,
	}, nil
}

func (b *WMezonBridge) TransferWithMemo(ctx context.Context, toAddress string, amount *big.Int, memo string) (string, error) {
	nonce, err := b.client.PendingNonceAt(ctx, b.fromAddress)
	if err != nil {
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	gasPrice, err := b.client.SuggestGasPrice(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get gas price: %w", err)
	}

	auth, err := bind.NewKeyedTransactorWithChainID(b.privateKey, b.chainID)
	if err != nil {
		return "", fmt.Errorf("failed to create transactor: %w", err)
	}

	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)
	auth.GasLimit = uint64(300000)
	auth.GasPrice = gasPrice
	auth.Context = ctx

	to := common.HexToAddress(toAddress)
	memoBytes := []byte(memo)

	log.Info().
		Str("to", to.Hex()).
		Str("amount", amount.String()).
		Str("memo", memo).
		Uint64("nonce", nonce).
		Msg("Sending TransferWithMemo transaction")

	tx, err := b.contract.TransferWithMemo(auth, to, amount, memoBytes)
	if err != nil {
		return "", fmt.Errorf("failed to send transaction: %w", err)
	}

	txHash := tx.Hash().Hex()

	log.Info().
		Str("txHash", txHash).
		Str("to", to.Hex()).
		Str("amount", amount.String()).
		Msg("Transaction sent successfully")

	return txHash, nil
}

func (b *WMezonBridge) GetBalance(ctx context.Context, address string) (*big.Int, error) {
	addr := common.HexToAddress(address)
	balance, err := b.contract.BalanceOf(&bind.CallOpts{Context: ctx}, addr)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}
	return balance, nil
}

func (b *WMezonBridge) GetMyBalance(ctx context.Context) (*big.Int, error) {
	return b.GetBalance(ctx, b.fromAddress.Hex())
}

func (b *WMezonBridge) Close() {
	if b.client != nil {
		b.client.Close()
	}
}
