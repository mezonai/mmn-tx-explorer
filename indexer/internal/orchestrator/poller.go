package orchestrator

import (
	"context"
	"fmt"
	"math/big"
	"sync"
	"time"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/metrics"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/worker"
	"github.com/rs/zerolog/log"
)

const DefaultBlocksPerPoll = 10
const DefaultTriggerInterval = 1000

type Poller struct {
	rpc                  rpc.IRPCClient
	blocksPerPoll        int64
	triggerIntervalMs    int64
	storage              storage.IStorage
	lastPolledBlock      *big.Int
	lastPolledBlockMutex sync.RWMutex
	pollFromBlock        *big.Int
	pollUntilBlock       *big.Int
	parallelPollers      int
	workModeChan         chan WorkMode
	currentWorkMode      WorkMode
	workModeMutex        sync.RWMutex
}

type BlockNumberWithError struct {
	BlockNumber *big.Int
	Error       error
}

type PollerOption func(*Poller)

func WithPollerWorkModeChan(ch chan WorkMode) PollerOption {
	return func(p *Poller) {
		p.workModeChan = ch
	}
}

func NewBoundlessPoller(rpcClient rpc.IRPCClient, store storage.IStorage, opts ...PollerOption) *Poller {
	blocksPerPoll := config.Cfg.Poller.BlocksPerPoll
	if blocksPerPoll == 0 {
		blocksPerPoll = DefaultBlocksPerPoll
	}
	triggerInterval := config.Cfg.Poller.Interval
	if triggerInterval == 0 {
		triggerInterval = DefaultTriggerInterval
	}
	poller := &Poller{
		rpc:               rpcClient,
		triggerIntervalMs: int64(triggerInterval),
		blocksPerPoll:     int64(blocksPerPoll),
		storage:           store,
		parallelPollers:   config.Cfg.Poller.ParallelPollers,
	}

	for _, opt := range opts {
		opt(poller)
	}

	return poller
}

var ErrNoNewBlocks = fmt.Errorf("no new blocks to poll")

func NewPoller(rpcClient rpc.IRPCClient, store storage.IStorage, opts ...PollerOption) *Poller {
	poller := NewBoundlessPoller(rpcClient, store, opts...)
	untilBlock := big.NewInt(int64(config.Cfg.Poller.UntilBlock))
	pollFromBlock := big.NewInt(int64(config.Cfg.Poller.FromBlock))
	lastPolledBlock := new(big.Int).Sub(pollFromBlock, big.NewInt(1)) // needs to include the first block
	if config.Cfg.Poller.ForceFromBlock {
		log.Debug().Msgf("ForceFromBlock is enabled, setting last polled block to %s", lastPolledBlock.String())
	} else {
		highestBlockFromStaging, err := store.StagingStorage.GetLastStagedBlockNumber(rpcClient.GetChainID(), pollFromBlock, untilBlock)
		if err != nil || highestBlockFromStaging == nil || highestBlockFromStaging.Sign() <= 0 {
			log.Warn().Err(err).Msgf("No last polled block found, setting to %s", lastPolledBlock.String())
		} else {
			log.Debug().Msgf("Last polled block found in staging: %s", highestBlockFromStaging.String())
			if highestBlockFromStaging.Cmp(pollFromBlock) > 0 {
				log.Debug().Msgf("Staging block %s is higher than configured start block %s", highestBlockFromStaging.String(), pollFromBlock.String())
				lastPolledBlock = highestBlockFromStaging
			}
		}
		highestBlockFromMainStorage, err := store.MainStorage.GetMaxBlockNumber(rpcClient.GetChainID())
		if err != nil {
			log.Error().Err(err).Msg("Error getting last block in main storage")
		} else if highestBlockFromMainStorage.Cmp(pollFromBlock) > 0 {
			log.Debug().Msgf("Main storage block %s is higher than configured start block %s", highestBlockFromMainStorage.String(), pollFromBlock.String())
			lastPolledBlock = highestBlockFromMainStorage
		}
	}
	poller.lastPolledBlock = lastPolledBlock
	poller.pollFromBlock = pollFromBlock
	poller.pollUntilBlock = untilBlock
	return poller
}

func (p *Poller) Start(ctx context.Context) {
	interval := time.Duration(p.triggerIntervalMs) * time.Millisecond
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	log.Debug().Msgf("Poller running")

	tasks := make(chan struct{}, p.parallelPollers)
	var blockRangeMutex sync.Mutex
	var wg sync.WaitGroup

	pollCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	for i := 0; i < p.parallelPollers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-pollCtx.Done():
					return
				case _, ok := <-tasks:
					if !ok {
						return
					}

					// Do not poll if not in backfill mode
					p.workModeMutex.RLock()
					if p.currentWorkMode != WorkModeBackfill {
						p.workModeMutex.RUnlock()
						continue
					}
					p.workModeMutex.RUnlock()

					blockRangeMutex.Lock()
					fromBlock, toBlock, err := p.getNextBlockRange(pollCtx)
					blockRangeMutex.Unlock()

					if pollCtx.Err() != nil {
						return
					}

					if err != nil {
						if err != ErrNoNewBlocks {
							log.Error().Err(err).Msg("Failed to get block range to poll")
						}
						continue
					}

					lastPolledBlock := p.Poll(pollCtx, fromBlock, toBlock)
					if p.reachedPollLimit(lastPolledBlock) {
						log.Warn().Msg("Reached poll limit, exiting poller")
						cancel()
						return
					}
				}
			}
		}()
	}

	for {
		select {
		case <-ctx.Done():
			p.shutdown(cancel, tasks, &wg)
			return
		case workMode := <-p.workModeChan:
			p.workModeMutex.RLock()
			currentWorkMode := p.currentWorkMode
			p.workModeMutex.RUnlock()
			if workMode != currentWorkMode && workMode != "" {
				log.Info().Msgf("Poller work mode changing from %s to %s", currentWorkMode, workMode)
				p.workModeMutex.Lock()
				changedToBackfillFromLive := currentWorkMode == WorkModeLive && workMode == WorkModeBackfill
				p.currentWorkMode = workMode
				p.workModeMutex.Unlock()
				if changedToBackfillFromLive {
					lastBlockInMainStorage, err := p.storage.MainStorage.GetMaxBlockNumber(p.rpc.GetChainID())
					if err != nil {
						log.Error().Err(err).Msg("Error getting last block in main storage")
					} else {
						p.lastPolledBlockMutex.Lock()
						p.lastPolledBlock = lastBlockInMainStorage
						p.lastPolledBlockMutex.Unlock()
						log.Debug().Msgf("Switching to backfill mode, updating last polled block to %s", p.lastPolledBlock.String())
					}
				}
			}
		case <-ticker.C:
			select {
			case tasks <- struct{}{}:
			default:
				// Channel full, skip this tick
			}
		}
	}
}

func (p *Poller) Poll(ctx context.Context, fromBlock, toBlock *big.Int) (lastPolledBlock *big.Int) {
	blockData, failedResults := p.PollWithoutSaving(ctx, fromBlock, toBlock)
	if len(blockData) > 0 || len(failedResults) > 0 {
		p.StageResults(blockData, failedResults)
	}

	var highestBlockNumber *big.Int
	if len(blockData) > 0 {
		highestBlockNumber = blockData[0].Block.Number
		for i := range blockData {
			block := &blockData[i]
			if block.Block.Number.Cmp(highestBlockNumber) > 0 {
				highestBlockNumber = new(big.Int).Set(block.Block.Number)
			}
		}
	}
	return highestBlockNumber
}

func (p *Poller) PollWithoutSaving(ctx context.Context, fromBlock, toBlock *big.Int) ([]common.BlockData, []rpc.GetFullBlockResult) {
	if fromBlock == nil || toBlock == nil {
		log.Debug().Msg("No blocks to poll, skipping")
		return nil, nil
	}
	if fromBlock.Cmp(toBlock) > 0 {
		log.Debug().Msg("No blocks to poll, invalid range")
		return nil, nil
	}

	endBlock := toBlock
	if endBlock != nil {
		p.lastPolledBlockMutex.Lock()
		p.lastPolledBlock = endBlock
		p.lastPolledBlockMutex.Unlock()
	}
	log.Debug().Msgf("Polling blocks starting from %s to %s", fromBlock, endBlock)

	endBlockNumberFloat, _ := endBlock.Float64()
	metrics.PollerLastTriggeredBlock.Set(endBlockNumberFloat)

	recoveryWorker := worker.NewWorker(p.rpc)
	results := recoveryWorker.Run(ctx, fromBlock, toBlock)
	blockData, failedResults := p.convertPollResultsToBlockData(results)
	return blockData, failedResults
}

func (p *Poller) convertPollResultsToBlockData(results []rpc.GetFullBlockResult) ([]common.BlockData, []rpc.GetFullBlockResult) {
	var successfulResults []rpc.GetFullBlockResult
	var failedResults []rpc.GetFullBlockResult

	for i := range results {
		result := &results[i]
		if result.Error != nil {
			bn := "<unknown>"
			if result.BlockNumber != nil {
				bn = result.BlockNumber.String()
			}
			log.Warn().Err(result.Error).Msgf("Error fetching block data for block %s", bn)
			failedResults = append(failedResults, *result)
		} else {
			successfulResults = append(successfulResults, *result)
		}
	}

	blockData := make([]common.BlockData, 0, len(successfulResults))
	for i := range successfulResults {
		result := &successfulResults[i]
		blockData = append(blockData, common.BlockData{
			Block:        result.Data.Block,
			Logs:         result.Data.Logs,
			Transactions: result.Data.Transactions,
			Traces:       result.Data.Traces,
		})
	}
	return blockData, failedResults
}

func (p *Poller) StageResults(blockData []common.BlockData, failedResults []rpc.GetFullBlockResult) {
	startTime := time.Now()
	metrics.PolledBatchSize.Set(float64(len(blockData)))
	if len(blockData) > 0 {
		if err := p.storage.StagingStorage.InsertStagingData(blockData); err != nil {
			e := fmt.Errorf("error inserting block data: %v", err)
			log.Error().Err(e)
			for i := range blockData {
				failedResults = append(failedResults, rpc.GetFullBlockResult{
					BlockNumber: blockData[i].Block.Number,
					Error:       e,
				})
			}
		}
	}
	log.Debug().Str("metric", "staging_insert_duration").Msgf("StagingStorage.InsertStagingData duration: %f", time.Since(startTime).Seconds())
	metrics.StagingInsertDuration.Observe(time.Since(startTime).Seconds())

	if len(failedResults) > 0 {
		p.handleBlockFailures(failedResults)
	}
}

func (p *Poller) reachedPollLimit(blockNumber *big.Int) bool {
	if blockNumber == nil {
		return true
	}
	if p.pollUntilBlock == nil || p.pollUntilBlock.Sign() <= 0 {
		return false
	}
	return blockNumber.Cmp(p.pollUntilBlock) >= 0
}

func (p *Poller) getNextBlockRange(ctx context.Context) (fromBlock *big.Int, toBlock *big.Int, err error) {
	latestBlock, err := p.rpc.GetLatestBlockNumber(ctx)
	if err != nil {
		return nil, nil, err
	}
	p.lastPolledBlockMutex.RLock()
	lastPolled := new(big.Int).Set(p.lastPolledBlock)
	p.lastPolledBlockMutex.RUnlock()
	log.Debug().Msgf("Last polled block: %s", lastPolled.String())

	startBlock := new(big.Int).Add(lastPolled, big.NewInt(1))
	if startBlock.Cmp(latestBlock) > 0 {
		log.Debug().Msgf("Start block %s is greater than latest block %s, skipping", startBlock, latestBlock)
		return nil, nil, ErrNoNewBlocks
	}
	endBlock := p.getEndBlockForRange(startBlock, latestBlock)
	if startBlock.Cmp(endBlock) > 0 {
		log.Debug().Msgf("Invalid range: start block %s is greater than end block %s, skipping", startBlock, endBlock)
		return nil, nil, nil
	}

	return startBlock, endBlock, nil
}

func (p *Poller) getEndBlockForRange(startBlock, latestBlock *big.Int) *big.Int {
	endBlock := new(big.Int).Add(startBlock, big.NewInt(p.blocksPerPoll-1))
	if endBlock.Cmp(latestBlock) > 0 {
		endBlock = latestBlock
	}
	if p.reachedPollLimit(endBlock) {
		log.Debug().Msgf("End block %s is greater than or equal to poll until block %s, setting range end to poll until block", endBlock, p.pollUntilBlock)
		endBlock = p.pollUntilBlock
	}
	return endBlock
}

func (p *Poller) handleBlockFailures(results []rpc.GetFullBlockResult) {
	var blockFailures []common.BlockFailure
	for i := range results {
		result := &results[i]
		if result.Error != nil {
			blockFailures = append(blockFailures, common.BlockFailure{
				BlockNumber:   result.BlockNumber,
				FailureReason: result.Error.Error(),
				FailureTime:   time.Now(),
				ChainID:       p.rpc.GetChainID(),
				FailureCount:  1,
			})
		}
	}
	err := p.storage.OrchestratorStorage.StoreBlockFailures(blockFailures)
	if err != nil {
		// TODO: exiting if this fails, but should handle this better
		log.Error().Err(err).Msg("Error saving block failures")
	}
}

func (p *Poller) shutdown(cancel context.CancelFunc, tasks chan struct{}, wg *sync.WaitGroup) {
	cancel()
	close(tasks)
	wg.Wait()
	log.Info().Msg("Poller shutting down")
}
