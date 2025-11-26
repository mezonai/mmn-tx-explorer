package rpc

import (
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
)

// TODO: we should detect this automatically
const (
	defaultBlocksPerRequest   = 1000
	defaultLogsPerRequest     = 100
	defaultTracesPerRequest   = 100
	defaultReceiptsPerRequest = 250
	defaultConcurrentRequests = 20
)

func GetBlockPerRequestConfig() BlocksPerRequestConfig {
	blocksPerRequest := config.Cfg.RPC.Blocks.BlocksPerRequest
	if blocksPerRequest == 0 {
		blocksPerRequest = defaultBlocksPerRequest
	}
	logsBlocksPerRequest := config.Cfg.RPC.Logs.BlocksPerRequest
	if logsBlocksPerRequest == 0 {
		logsBlocksPerRequest = defaultLogsPerRequest
	}
	tracesBlocksPerRequest := config.Cfg.RPC.Traces.BlocksPerRequest
	if tracesBlocksPerRequest == 0 {
		tracesBlocksPerRequest = defaultTracesPerRequest
	}
	blockReceiptsBlocksPerRequest := config.Cfg.RPC.BlockReceipts.BlocksPerRequest
	if blockReceiptsBlocksPerRequest == 0 {
		blockReceiptsBlocksPerRequest = defaultReceiptsPerRequest
	}
	concurrentRequests := config.Cfg.RPC.Blocks.ConcurrentRequests
	if concurrentRequests == 0 {
		concurrentRequests = defaultConcurrentRequests
	}
	return BlocksPerRequestConfig{
		Blocks:             blocksPerRequest,
		Logs:               logsBlocksPerRequest,
		Traces:             tracesBlocksPerRequest,
		Receipts:           blockReceiptsBlocksPerRequest,
		ConcurrentRequests: concurrentRequests,
	}
}
