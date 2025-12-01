package worker

import (
	"context"
	"math/big"
	"sort"
	"sync"
	"time"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
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

func (w *Worker) processChunkWithRetry(ctx context.Context, chunk []*big.Int, resultsCh chan<- []rpc.GetFullBlockResult, sem chan struct{}) {
	select {
	case <-ctx.Done():
		return
	default:
	}

	// Acquire semaphore only for the RPC request
	sem <- struct{}{}
	results := w.rpc.GetFullBlocks(ctx, chunk)
	<-sem // Release semaphore immediately after RPC request

	if len(chunk) == 1 {
		// chunk size 1 is the minimum, so we return whatever we get
		resultsCh <- results
		return
	}

	// Check for failed blocks
	var failedBlocks []*big.Int
	var successfulResults []rpc.GetFullBlockResult

	for i := range results {
		result := &results[i]
		if result.Error != nil {
			failedBlocks = append(failedBlocks, chunk[i])
		} else {
			successfulResults = append(successfulResults, *result)
		}
	}

	log.Debug().Msgf("Out of %d blocks, %d successful, %d failed", len(results), len(successfulResults), len(failedBlocks))
	// If we have successful results, send them
	if len(successfulResults) > 0 {
		resultsCh <- successfulResults
	}

	// If no blocks failed, we're done
	if len(failedBlocks) == 0 {
		return
	}

	// can't split any further, so try one last time
	if len(failedBlocks) == 1 {
		w.processChunkWithRetry(ctx, failedBlocks, resultsCh, sem)
		return
	}

	// Split failed blocks in half and retry
	mid := len(failedBlocks) / 2
	leftChunk := failedBlocks[:mid]
	rightChunk := failedBlocks[mid:]

	log.Debug().Msgf("Splitting %d failed blocks into chunks of %d and %d", len(failedBlocks), len(leftChunk), len(rightChunk))

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		w.processChunkWithRetry(ctx, leftChunk, resultsCh, sem)
	}()

	go func() {
		defer wg.Done()
		w.processChunkWithRetry(ctx, rightChunk, resultsCh, sem)
	}()

	wg.Wait()
}

func (w *Worker) Run(ctx context.Context, blockNumbers []*big.Int) []rpc.GetFullBlockResult {
	blockCount := len(blockNumbers)
	blockPerRequestConfig := w.rpc.GetBlocksPerRequest()
	chunks := common.SliceToChunks(blockNumbers, blockPerRequestConfig.Blocks)

	var wg sync.WaitGroup
	resultsCh := make(chan []rpc.GetFullBlockResult, blockCount)

	// Create a semaphore channel to limit concurrent goroutines
	sem := make(chan struct{}, blockPerRequestConfig.ConcurrentRequests)

	log.Debug().Msgf("Worker Processing %d blocks in %d chunks of max %d blocks", blockCount, len(chunks), w.rpc.GetBlocksPerRequest().Blocks)

	for i, chunk := range chunks {
		if i > 0 {
			time.Sleep(time.Duration(config.Cfg.RPC.Blocks.BatchDelay) * time.Millisecond)
		}
		select {
		case <-ctx.Done():
			log.Debug().Msg("Context canceled, stopping Worker")
			return nil
		default:
			// keep processing
		}

		wg.Add(1)
		go func(chunk []*big.Int) {
			defer wg.Done()
			w.processChunkWithRetry(ctx, chunk, resultsCh, sem)
		}(chunk)
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
