package bridge

import (
	"context"
	"crypto/ecdsa"
	"database/sql"

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
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/rs/zerolog/log"
)

const (
	CONFIRMATION_BLOCKS = 5
	RECONNECT_DELAY     = 5 * time.Second
	POLL_BATCH_SIZE     = 1000
)

type BSCBridge struct {
	config          *models.BridgeConfig
	wsClient        *ethclient.Client
	rpcClient       *ethclient.Client
	contract        *contracts.WMEZON
	contractAddress common.Address
	ownerKey        string
	ownerAddress    common.Address
	repo            repository.BridgeSwapRepository
	mu              sync.RWMutex
	isRunning       bool
	stopChan        chan struct{}
	wg              sync.WaitGroup
	contractABI     abi.ABI
}

func NewBSCBridge(cfg *models.BridgeConfig, repo repository.BridgeSwapRepository) (*BSCBridge, error) {
	if cfg.BSCRPCURL == "" || cfg.WMezonAddress == "" || cfg.OwnerPrivateKey == "" {
		return nil, fmt.Errorf("missing required BSC bridge configuration")
	}

	privateKey, err := crypto.HexToECDSA(strings.TrimPrefix(cfg.OwnerPrivateKey, "0x"))
	if err != nil {
		return nil, fmt.Errorf("invalid owner private key: %w", err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("error casting public key to ECDSA")
	}

	ownerAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	rpcClient, err := ethclient.Dial(cfg.BSCRPCURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to BSC RPC: %w", err)
	}

	contractAddress := common.HexToAddress(cfg.WMezonAddress)
	contract, err := contracts.NewWMEZON(contractAddress, rpcClient)
	if err != nil {
		return nil, fmt.Errorf("failed to instantiate WMEZON contract: %w", err)
	}

	bridge := &BSCBridge{
		config:          cfg,
		rpcClient:       rpcClient,
		contract:        contract,
		contractAddress: contractAddress,
		ownerKey:        cfg.OwnerPrivateKey,
		ownerAddress:    ownerAddress,
		repo:            repo,
		stopChan:        make(chan struct{}),
	}
	parsedABI, err := abi.JSON(strings.NewReader(contracts.WMEZONABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse WMEZON contract ABI: %w", err)
	}
	bridge.contractABI = parsedABI

	log.Info().
		Str("owner", ownerAddress.Hex()).
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
	if err == nil {
		if savedBlock > lastBlock {
			lastBlock = savedBlock
		}
	} else if err != sql.ErrNoRows {
		log.Error().Err(err).Msg("Failed to get last processed block, using config start_block")
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

			log.Debug().
				Uint64("fromBlock", lastBlock+1).
				Uint64("toBlock", toBlock).
				Msg("Polling BSC blocks for Bridge events")

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
			_, err := wsClient.BlockNumber(ctx)
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

	event := new(contracts.WMEZONTransferMemo)
	if err := contracAbi.UnpackIntoInterface(event, "TransferMemo", vLog.Data); err != nil {
		return fmt.Errorf("failed to unpack event: %w", err)
	}

	event.From = common.HexToAddress(vLog.Topics[1].Hex())
	event.To = common.HexToAddress(vLog.Topics[2].Hex())
	event.Raw = vLog

	if event.To != b.ownerAddress {
		log.Info().
			Str("to", event.To.Hex()).
			Str("owner", b.ownerAddress.Hex()).
			Msg("Ignoring TransferMemo event: not sent to owner address")
		return nil
	}

	log.Info().
		Str("from", event.From.Hex()).
		Str("to", event.To.Hex()).
		Str("amount", event.Amount.String()).
		Str("memo", string(event.Memo)).
		Str("txHash", vLog.TxHash.Hex()).
		Msg("Bridge TransferMemo event detected")
	return b.processBridgeTransfer(ctx, event)
}

func (b *BSCBridge) processBridgeTransfer(ctx context.Context, event *contracts.WMEZONTransferMemo) error {
	memo := string(event.Memo)
	recipientAddress := event.From.Hex()
	amount := event.Amount
	// extraInfo, err := b.verifyMemo(memo)
	// if err != nil {
	// 	return fmt.Errorf("invalid memo: %w", err)
	// }

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
	// TODO: Transfer the tokens to recipientAddress on the destination chain
	// outTxHash, transferErr = j.blockchainService.Transfer(
	// 	envelope.RedEnvelopeWallet,
	// 	envelope.OwnerWallet,
	// 	remainingBalance,
	// 	privateKey,
	// 	extraInfo
	// )
	outTxHash := ""
	transferErr := error(nil)
	if transferErr != nil {
		log.Error().Err(transferErr).Str("txHash", txHash).Msg("Transfer failed")

		updateErr := b.repo.UpdateTransactionStatus(ctx, txHash, "FAILED", "", transferErr.Error())
		if updateErr != nil {
			log.Error().Err(updateErr).Msg("Failed to update FAILED status to DB")
		}
		return transferErr
	}

	log.Info().Str("inTx", txHash).Str("outTx", outTxHash).Msg("Transfer success")

	updateErr := b.repo.UpdateTransactionStatus(ctx, txHash, "COMPLETED", outTxHash, "")
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
