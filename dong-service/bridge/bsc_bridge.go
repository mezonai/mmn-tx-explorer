package bridge

import (
	"context"

	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/contracts"
	"dong-service/models"
	"dong-service/repository"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/rs/zerolog/log"
)

const (
	CONFIRMATION_BLOCKS = 5
	RECONNECT_DELAY     = 5 * time.Second
	POLL_BATCH_SIZE     = 1000
)

type BSCBridge struct {
	config              *models.BridgeConfig
	wsClient            *ethclient.Client
	rpcClient           *ethclient.Client
	contract            *contracts.WMezon
	contractAddress     common.Address
	repo                repository.BridgeSwapRepository
	blockchainService   *blockchain.BlockchainService
	encryptedPrivateKey string
	mu                  sync.RWMutex
	isRunning           bool
	stopChan            chan struct{}
	wg                  sync.WaitGroup
	contractABI         abi.ABI
}

func NewBSCBridge(cfg *models.BridgeConfig, repo repository.BridgeSwapRepository, blockchainSvc *blockchain.BlockchainService, encryptedPrivateKey string) (*BSCBridge, error) {
	if cfg.BSCRPCURL == "" || cfg.WMezonAddressContract == "" {
		return nil, fmt.Errorf("missing required BSC bridge configuration")
	}

	if blockchainSvc == nil {
		return nil, fmt.Errorf("blockchain service is required")
	}

	if encryptedPrivateKey == "" {
		return nil, fmt.Errorf("encrypted private key is required")
	}

	rpcClient, err := ethclient.Dial(cfg.BSCRPCURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to BSC RPC: %w", err)
	}

	contractAddress := common.HexToAddress(cfg.WMezonAddressContract)
	contract, err := contracts.NewWMezon(contractAddress, rpcClient)
	if err != nil {
		return nil, fmt.Errorf("failed to instantiate WMEZON contract: %w", err)
	}

	bridge := &BSCBridge{
		config:              cfg,
		rpcClient:           rpcClient,
		contract:            contract,
		contractAddress:     contractAddress,
		repo:                repo,
		blockchainService:   blockchainSvc,
		encryptedPrivateKey: encryptedPrivateKey,
		stopChan:            make(chan struct{}),
	}
	parsedABI, err := abi.JSON(strings.NewReader(contracts.WMezonABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse WMEZON contract ABI: %w", err)
	}
	bridge.contractABI = parsedABI

	log.Info().
		Str("contract", contractAddress.Hex()).
		Msg("BSC Bridge initialized")

	return bridge, nil
}

func (b *BSCBridge) Start(ctx context.Context) error {
	b.mu.Lock()
	if b.isRunning {
		b.mu.Unlock()
		return fmt.Errorf("BSC Bridge is already running")
	}
	b.isRunning = true
	b.mu.Unlock()

	b.wg.Add(2)
	go b.runPolling(ctx)
	go b.runSubscription(ctx)
	log.Info().Msg("Bridge started in HYBRID mode (Polling + Subscription)")

	return nil
}

func (b *BSCBridge) Stop() {
	b.mu.Lock()
	if !b.isRunning {
		b.mu.Unlock()
		return
	}
	b.isRunning = false
	b.mu.Unlock()

	close(b.stopChan)
	b.wg.Wait()

	if b.wsClient != nil {
		b.wsClient.Close()
	}
	if b.rpcClient != nil {
		b.rpcClient.Close()
	}
	log.Info().Msg("BSC Bridge stopped")
}

func (b *BSCBridge) runPolling(ctx context.Context) {
	defer b.wg.Done()

	lastBlock := b.config.StartBlock
	savedBlock, err := b.repo.GetLastProcessedBlock(ctx)
	if err != nil && savedBlock > lastBlock {
		lastBlock = savedBlock
	}

	ticker := time.NewTicker(b.config.PollingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-b.stopChan:
			return
		case <-ticker.C:
			currentBlock, err := b.rpcClient.BlockNumber(ctx)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get current block number from BSC RPC")
				continue
			}

			if currentBlock < b.config.ConfirmationBlocks {
				continue
			}

			confirmedBlock := currentBlock - b.config.ConfirmationBlocks
			if lastBlock >= confirmedBlock {
				continue
			}

			toBlock := lastBlock + POLL_BATCH_SIZE
			if toBlock > confirmedBlock {
				toBlock = confirmedBlock
			}

			log.Info().
				Uint64("fromBlock", lastBlock+1).
				Uint64("toBlock", toBlock).
				Msg("🔍 Polling BSC blocks for Bridge events")

			if err := b.processBlocks(ctx, lastBlock+1, toBlock); err != nil {
				log.Error().Err(err).Msg("Error processing Bridge events")
				continue
			}
			lastBlock = toBlock
			if err := b.repo.SaveLastProcessedBlock(ctx, lastBlock); err != nil {
				log.Error().Err(err).Msg("Failed to save last processed block")
			}
		}
	}
}

func (b *BSCBridge) runSubscription(ctx context.Context) {
	defer b.wg.Done()
	for {
		select {
		case <-ctx.Done():
			return
		case <-b.stopChan:
			return
		default:
			if err := b.subscribeToBridgeEvents(ctx); err != nil {
				log.Error().Err(err).Msg("BSC Bridge subscription error, reconnecting...")
				time.Sleep(RECONNECT_DELAY)
			}
		}
	}
}

func (b *BSCBridge) subscribeToBridgeEvents(ctx context.Context) error {
	wsClient, err := ethclient.Dial(b.config.BSCWSURL)
	if err != nil {
		return fmt.Errorf("failed to connect to BSC WebSocket: %w", err)
	}
	defer wsClient.Close()

	b.mu.Lock()
	b.wsClient = wsClient
	b.mu.Unlock()

	query := ethereum.FilterQuery{
		Addresses: []common.Address{b.contractAddress},
	}

	logs := make(chan types.Log)
	sub, err := wsClient.SubscribeFilterLogs(ctx, query, logs)
	if err != nil {
		return fmt.Errorf("failed to subscribe to BSC logs: %w", err)
	}
	defer sub.Unsubscribe()

	log.Info().Msg("Subscribed to BSC Bridge events")

	pingTicker := time.NewTicker(30 * time.Second)
	defer pingTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-b.stopChan:
			return nil
		case err := <-sub.Err():
			return fmt.Errorf("BSC subscription error: %w", err)
		case <-pingTicker.C:
			blockNumber, err := wsClient.BlockNumber(ctx)
			log.Info().Uint64("blockNumber", blockNumber).Msg("BSC WebSocket ping")
			if err != nil {
				return fmt.Errorf("connecting lost: %w", err)
			}
		case vLog := <-logs:
			go func(eventLog types.Log) {
				time.Sleep(time.Duration(CONFIRMATION_BLOCKS) * 3 * time.Second)
				if err := b.handleTransferMemoEvent(ctx, eventLog); err != nil {
					log.Error().
						Err(err).
						Str("txHash", eventLog.TxHash.Hex()).
						Msg("Error handling Bridge event")
				}
			}(vLog)
		}
	}
}

func (b *BSCBridge) processBlocks(ctx context.Context, fromBlock, toBlock uint64) error {
	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(fromBlock)),
		ToBlock:   big.NewInt(int64(toBlock)),
		Addresses: []common.Address{b.contractAddress},
	}

	logs, err := b.rpcClient.FilterLogs(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to filter logs: %w", err)
	}

	for _, vLog := range logs {
		if err := b.handleTransferMemoEvent(ctx, vLog); err != nil {
			log.Error().
				Err(err).
				Str("txHash", vLog.TxHash.Hex()).
				Msg("Error handling Bridge event")
		}
	}

	return nil
}

func (b *BSCBridge) handleTransferMemoEvent(ctx context.Context, vLog types.Log) error {
	contracAbi := b.contractABI
	transferMemoEventID := contracAbi.Events["TransferMemo"].ID
	if vLog.Topics[0] != transferMemoEventID {
		return nil
	}

	event := new(contracts.WMezonTransferMemo)
	if err := contracAbi.UnpackIntoInterface(event, "TransferMemo", vLog.Data); err != nil {
		return fmt.Errorf("failed to unpack event: %w", err)
	}

	event.From = common.HexToAddress(vLog.Topics[1].Hex())
	event.To = common.HexToAddress(vLog.Topics[2].Hex())
	event.Raw = vLog

	return b.processBridgeTransfer(ctx, event)
}

func (b *BSCBridge) processBridgeTransfer(ctx context.Context, event *contracts.WMezonTransferMemo) error {
	memo := string(event.Memo)

	var memoData map[string]string
	recipientAddress := event.From.Hex() // Default to sender if memo parsing fails

	if err := json.Unmarshal([]byte(memo), &memoData); err == nil {
		if addr, ok := memoData["a"]; ok && addr != "" {
			recipientAddress = addr
		}
	}

	amount := event.Amount
	txHash := event.Raw.TxHash.Hex()
	processed, err := b.repo.IsTransactionProcessed(ctx, txHash)
	if err != nil {
		return fmt.Errorf("failed to check transaction processed: %w", err)
	}
	if processed {
		log.Info().
			Str("txHash", txHash).
			Msg("Transaction already processed, skipping")
		return nil
	}
	err = b.repo.CreatePendingTransaction(ctx, txHash, recipientAddress, amount.String(), memo)
	if err != nil {
		return fmt.Errorf("failed to create pending transaction: %w", err)
	}
	amountInt64 := new(big.Int).Div(amount, big.NewInt(1e18)).Int64()
	if amountInt64 <= 0 {
		log.Error().Str("txHash", txHash).Int64("amount", amountInt64).Msg("Amount too small after conversion")
		updateErr := b.repo.UpdateTransactionStatus(ctx, txHash, constants.BridgeStatusFailed, "", "Amount too small (< 1 token after conversion)")
		if updateErr != nil {
			log.Error().Err(updateErr).Msg("Failed to update FAILED status to DB")
		}
		return fmt.Errorf("amount too small: %d tokens", amountInt64)
	}

	outTxHash, transferErr := b.blockchainService.TransferMoney(
		b.encryptedPrivateKey,
		b.config.WMezonAddress,
		recipientAddress,
		amountInt64,
		fmt.Sprintf("Swap from BSC tx: %s", txHash),
		constants.ExtraInfoBridgeTransfer,
	)
	if transferErr != nil {
		log.Error().Err(transferErr).Str("txHash", txHash).Msg("Transfer failed")
		updateErr := b.repo.UpdateTransactionStatus(ctx, txHash, constants.BridgeStatusFailed, "", transferErr.Error())
		if updateErr != nil {
			log.Error().Err(updateErr).Msg("Failed to update FAILED status to DB")
		}
		return transferErr
	}

	updateErr := b.repo.UpdateTransactionStatus(ctx, txHash, constants.BridgeStatusCompleted, outTxHash, "")
	if updateErr != nil {
		log.Error().Err(updateErr).Msg("CRITICAL: Money sent but failed to update DB status")
		return fmt.Errorf("money sent but db update failed: %w", updateErr)
	}

	return nil
}

func (b *BSCBridge) verifyMemo(memoStr string) (map[string]interface{}, error) {
	if memoStr == "" {
		return nil, errors.New("memo is empty")
	}

	var memoData models.BridgeMemo
	cleanMemo := strings.TrimSpace(memoStr)
	if err := json.Unmarshal([]byte(cleanMemo), &memoData); err != nil {
		return nil, fmt.Errorf("invalid memo format (not json): %w", err)
	}

	if memoData.UserID == "" {
		return nil, errors.New("missing user_id in memo")
	}

	extraInfo := map[string]interface{}{
		"type":     "bridge-transfer",
		"user_id":  memoData.UserID,
		"raw_memo": memoStr,
	}

	return extraInfo, nil
}
