package cmd

import (
	"context"
	"math/big"
	"os"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var (
	syncFromBlock int64
	syncToBlock   int64

	// Run: ./main sync-blocks --from 1000 --to 2000 --config configs/config.yml
	syncBlocksCmd = &cobra.Command{
		Use:   "sync-blocks",
		Short: "Sync blocks from RPC to DB starting from a specific block",
		Long:  "Sync blocks from RPC to DB starting from a specific block. If --to is not specified, it will sync up to the latest block available on RPC.",
		Run: func(cmd *cobra.Command, args []string) {
			RunSyncBlocks(cmd, args)
		},
	}
)

func init() {
	syncBlocksCmd.Flags().Int64Var(&syncFromBlock, "from", 0, "Block number to start syncing from")
	syncBlocksCmd.MarkFlagRequired("from")
	syncBlocksCmd.Flags().Int64Var(&syncToBlock, "to", 0, "Block number to stop syncing at (inclusive). If 0 or not set, syncs to latest block.")
}

func RunSyncBlocks(cmd *cobra.Command, args []string) {
	// Initialize resources (config, logger, rpc, storage) - similar to RunValidationMigration
	rpcClient, err := rpc.Initialize()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize RPC")
	}
	defer rpcClient.Close()

	s, err := storage.NewStorageConnector(&config.Cfg.Storage)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize storage")
	}

	// Determine range
	startBlock := big.NewInt(syncFromBlock)
	endBlock := big.NewInt(syncToBlock)

	if startBlock.Cmp(endBlock) > 0 {
		log.Fatal().Msgf("Start block (%s) is greater than end block (%s)", startBlock.String(), endBlock.String())
	}

	log.Info().Msgf("Starting sync from block %s to %s", startBlock.String(), endBlock.String())

	// Batch processing
	rpcConfig := rpcClient.GetBlocksPerRequest()
	batchSize := int64(rpcConfig.Blocks)
	if batchSize <= 0 {
		batchSize = 50 // Default fallback
	}

	for current := new(big.Int).Set(startBlock); current.Cmp(endBlock) <= 0; {
		batchEnd := new(big.Int).Add(current, big.NewInt(batchSize-1))
		if batchEnd.Cmp(endBlock) > 0 {
			batchEnd = new(big.Int).Set(endBlock)
		}

		log.Info().Msgf("Processing batch: %s - %s", current.String(), batchEnd.String())

		// Check for missing blocks in DB
		missingBlocks, err := s.MainStorage.FindMissingBlockNumbers(rpcClient.GetChainID(), current, batchEnd)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to find missing blocks")
		}

		if len(missingBlocks) == 0 {
			log.Info().Msg("All blocks in batch already exist in DB, skipping...")
			current.Add(batchEnd, big.NewInt(1))
			continue
		}

		log.Info().Msgf("Found %d missing blocks in batch, fetching from RPC...", len(missingBlocks))

		// Fetch from RPC
		// We use GetFullBlocks which returns []RPCResult[BlockData]
		// We need to handle potential errors in results
		rpcResults := rpcClient.GetFullBlocks(context.Background(), missingBlocks)

		var blocksToInsert []common.BlockData
		for _, res := range rpcResults {
			if res.Error != nil {
				log.Error().Err(res.Error).Msgf("Failed to fetch block %s", res.BlockNumber.String())
				// We can continue or exit. Exiting is safer for "manual" sync to ensure integrity or we could skip.
				// Let's exit to force user attention.
				os.Exit(1)
			}
			blocksToInsert = append(blocksToInsert, res.Data)
		}

		if len(blocksToInsert) > 0 {
			if err := s.MainStorage.InsertBlockData(blocksToInsert); err != nil {
				log.Fatal().Err(err).Msg("Failed to insert block data")
			}
			log.Info().Msgf("Successfully inserted %d blocks", len(blocksToInsert))
		}

		// Move to next batch
		current.Add(batchEnd, big.NewInt(1))
	}

	log.Info().Msg("Sync completed successfully")
}
