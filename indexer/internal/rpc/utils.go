package rpc

import (
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
)

// TODO: we should detect this automatically
const (
	DEFAULT_BLOCKS_PER_REQUEST   = 1000
	DEFAULT_LOGS_PER_REQUEST     = 100
	DEFAULT_TRACES_PER_REQUEST   = 100
	DEFAULT_RECEIPTS_PER_REQUEST = 250
	DEFAULT_CONCURRENT_REQUESTS  = 20
)

func GetBlockPerRequestConfig() BlocksPerRequestConfig {
	blocksPerRequest := config.Cfg.RPC.Blocks.BlocksPerRequest
	if blocksPerRequest == 0 {
		blocksPerRequest = DEFAULT_BLOCKS_PER_REQUEST
	}
	logsBlocksPerRequest := config.Cfg.RPC.Logs.BlocksPerRequest
	if logsBlocksPerRequest == 0 {
		logsBlocksPerRequest = DEFAULT_LOGS_PER_REQUEST
	}
	tracesBlocksPerRequest := config.Cfg.RPC.Traces.BlocksPerRequest
	if tracesBlocksPerRequest == 0 {
		tracesBlocksPerRequest = DEFAULT_TRACES_PER_REQUEST
	}
	blockReceiptsBlocksPerRequest := config.Cfg.RPC.BlockReceipts.BlocksPerRequest
	if blockReceiptsBlocksPerRequest == 0 {
		blockReceiptsBlocksPerRequest = DEFAULT_RECEIPTS_PER_REQUEST
	}
	concurrentRequests := config.Cfg.RPC.Blocks.ConcurrentRequests
	if concurrentRequests == 0 {
		concurrentRequests = DEFAULT_CONCURRENT_REQUESTS
	}
	return BlocksPerRequestConfig{
		Blocks:             blocksPerRequest,
		Logs:               logsBlocksPerRequest,
		Traces:             tracesBlocksPerRequest,
		Receipts:           blockReceiptsBlocksPerRequest,
		ConcurrentRequests: concurrentRequests,
	}
}
