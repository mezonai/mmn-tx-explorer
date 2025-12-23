package worker

import (
	"context"
	"math/big"
	"sort"
	"sync"
	"time"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/metrics"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	"github.com/rs/zerolog/log"
)

type Worker struct {
	rpc rpc.IRPCClient
}

func NewWorker(rpcClient rpc.IRPCClient) *Worker {
	return &Worker{
		rpc: rpcClient,
	}
}

func (w *Worker) processRangeWithRetry(ctx context.Context, fromBlock, toBlock *big.Int, resultsCh chan<- []rpc.GetFullBlockResult, sem chan struct{}) {
	select {
	case <-ctx.Done():
		return
	default:
	}

	if fromBlock == nil || toBlock == nil {
		return
	}
	if fromBlock.Cmp(toBlock) > 0 {
		return
	}

	fromSlot := fromBlock.Uint64()
	toSlot := toBlock.Uint64()
	expectedCount := int64(toSlot-fromSlot) + 1

	// Acquire semaphore only for the RPC request
	sem <- struct{}{}
	results := w.rpc.GetFullBlocks(ctx, fromSlot, toSlot)
	<-sem // Release semaphore immediately after RPC request

	if expectedCount == 1 {
		// chunk size 1 is the minimum, so we return whatever we get
		resultsCh <- results
		return
	}

	hasError := false
	for i := range results {
		if results[i].Error != nil {
			hasError = true
			break
		}
	}

	if !hasError {
		resultsCh <- results
		return
	}

	midSlot := (fromSlot + toSlot) / 2
	leftFrom := new(big.Int).SetUint64(fromSlot)
	leftTo := new(big.Int).SetUint64(midSlot)
	rightFrom := new(big.Int).SetUint64(midSlot + 1)
	rightTo := new(big.Int).SetUint64(toSlot)

	log.Debug().Msgf("RPC range failed, splitting range %d-%d into %d-%d and %d-%d", fromSlot, toSlot, fromSlot, midSlot, midSlot+1, toSlot)

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		w.processRangeWithRetry(ctx, leftFrom, leftTo, resultsCh, sem)
	}()

	go func() {
		defer wg.Done()
		w.processRangeWithRetry(ctx, rightFrom, rightTo, resultsCh, sem)
	}()

	wg.Wait()
}

func (w *Worker) Run(ctx context.Context, fromBlock, toBlock *big.Int) []rpc.GetFullBlockResult {
	if fromBlock == nil || toBlock == nil {
		return nil
	}
	if fromBlock.Cmp(toBlock) > 0 {
		return nil
	}

	blockPerRequestConfig := w.rpc.GetBlocksPerRequest()
	chunkSize := int64(blockPerRequestConfig.Blocks)
	if chunkSize <= 0 {
		chunkSize = 1
	}
	blockCount := new(big.Int).Sub(toBlock, fromBlock).Int64() + 1
	if blockCount <= 0 {
		return nil
	}

	var wg sync.WaitGroup
	resultsCh := make(chan []rpc.GetFullBlockResult, int(blockCount))

	// Create a semaphore channel to limit concurrent goroutines
	sem := make(chan struct{}, blockPerRequestConfig.ConcurrentRequests)

	chunkCount := (blockCount + chunkSize - 1) / chunkSize
	log.Debug().Msgf("Worker Processing %d blocks in %d chunks of max %d blocks", blockCount, chunkCount, w.rpc.GetBlocksPerRequest().Blocks)

	chunkIdx := int64(0)
	for start := new(big.Int).Set(fromBlock); start.Cmp(toBlock) <= 0; start.Add(start, big.NewInt(chunkSize)) {
		if chunkIdx > 0 {
			time.Sleep(time.Duration(config.Cfg.RPC.Blocks.BatchDelay) * time.Millisecond)
		}
		select {
		case <-ctx.Done():
			log.Debug().Msg("Context canceled, stopping Worker")
			return nil
		default:
			// keep processing
		}

		end := new(big.Int).Add(start, big.NewInt(chunkSize-1))
		if end.Cmp(toBlock) > 0 {
			end = new(big.Int).Set(toBlock)
		}

		wg.Add(1)
		go func(chunkFrom, chunkTo *big.Int) {
			defer wg.Done()
			w.processRangeWithRetry(ctx, chunkFrom, chunkTo, resultsCh, sem)
		}(new(big.Int).Set(start), new(big.Int).Set(end))
		chunkIdx++
	}

	go func() {
		wg.Wait()
		close(resultsCh)
	}()

	results := make([]rpc.GetFullBlockResult, 0, blockCount)
	for batchResults := range resultsCh {
		results = append(results, batchResults...)
	}

	// Diagnostics: log entries missing block number or with error
	for i := range results {
		r := &results[i]
		if r.BlockNumber == nil {
			log.Error().Int("idx", i).Msg("Worker.Run: nil BlockNumber in results before sort")
		}
		if r.Error != nil {
			log.Error().Int("idx", i).Err(r.Error).Msg("Worker.Run: result has error before sort")
		}
	}

	// Filter out entries that have nil BlockNumber to avoid nil dereference in sort comparator
	filtered := make([]rpc.GetFullBlockResult, 0, len(results))
	for i := range results {
		r := &results[i]
		if r.BlockNumber != nil {
			filtered = append(filtered, *r)
		}
	}
	if len(filtered) != len(results) {
		log.Warn().Int("dropped", len(results)-len(filtered)).Int("total", len(results)).Msg("Worker.Run: dropped results with nil BlockNumber before sort")
	}

	// Sort results by block number with extra guard
	sort.Slice(filtered, func(i, j int) bool {
		if filtered[i].BlockNumber == nil {
			return false
		}
		if filtered[j].BlockNumber == nil {
			return true
		}
		return filtered[i].BlockNumber.Cmp(filtered[j].BlockNumber) < 0
	})

	// track the last fetched block number
	if len(filtered) > 0 {
		lastBlockNumberFloat, _ := filtered[len(filtered)-1].BlockNumber.Float64()
		metrics.LastFetchedBlock.Set(lastBlockNumberFloat)
	}
	return filtered
}
