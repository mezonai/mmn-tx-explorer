package cmd

import (
	"fmt"
	"math/big"
	"strconv"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/orchestrator"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/validation"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var (
	validateAndFixCmd = &cobra.Command{
		Use:   "validateAndFix",
		Short: "Validate and fix blockchain data",
		Long:  "Validate blockchain data in batches and automatically fix any issues found including duplicates, gaps, and invalid blocks",
		Run: func(cmd *cobra.Command, args []string) {
			RunValidateAndFix(cmd, args)
		},
	}
)

func RunValidateAndFix(cmd *cobra.Command, args []string) {
	batchSize := big.NewInt(1000)
	fixBatchSize := 0 // default is no batch size
	if len(args) > 0 {
		batchSizeFromArgs, err := strconv.Atoi(args[0])
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to parse batch size")
		}
		if batchSizeFromArgs < 1 {
			batchSizeFromArgs = 1
		}
		batchSize = big.NewInt(int64(batchSizeFromArgs))
		log.Info().Msgf("Using batch size %d from args", batchSize)
	}
	if len(args) > 1 {
		fixBatchSizeFromArgs, err := strconv.Atoi(args[1])
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to parse fix batch size")
		}
		fixBatchSize = fixBatchSizeFromArgs
	}
	log.Debug().Msgf("Batch size: %d, fix batch size: %d", batchSize, fixBatchSize)
	batchSize = new(big.Int).Sub(batchSize, big.NewInt(1)) // -1 because range ends are inclusive

	rpcClient, err := rpc.Initialize()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize RPC")
	}
	log.Info().Msgf("Running validationAndFix for chain %d", rpcClient.GetChainID())

	s, err := storage.NewStorageConnector(&config.Cfg.Storage)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize storage")
	}
	cursor, err := validation.InitCursor(rpcClient.GetChainID(), s)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize cursor")
	}
	log.Debug().Msgf("Cursor initialized for chain %d, starting from block %d", rpcClient.GetChainID(), cursor.LastScannedBlockNumber)

	startBlock := new(big.Int).Add(cursor.LastScannedBlockNumber, big.NewInt(1))

	for startBlock.Cmp(cursor.MaxBlockNumber) <= 0 {
		batchEndBlock := new(big.Int).Add(startBlock, batchSize)
		if batchEndBlock.Cmp(cursor.MaxBlockNumber) > 0 {
			batchEndBlock = new(big.Int).Set(cursor.MaxBlockNumber)
		}

		log.Info().Msgf("Validating batch of blocks from %s to %s", startBlock.String(), batchEndBlock.String())
		err := validateAndFixRange(rpcClient, s, startBlock, batchEndBlock, fixBatchSize)
		if err != nil {
			log.Fatal().Err(err).Msgf("failed to validate and fix range %v-%v", startBlock, batchEndBlock)
		}

		startBlock = new(big.Int).Add(batchEndBlock, big.NewInt(1))
		err = cursor.Update(batchEndBlock)
		if err != nil {
			log.Fatal().Err(err).Msgf("Failed to update cursor: %s", err.Error())
		}
	}
}

/**
 * Validates a range of blocks (end and start are inclusive) for a given chain and fixes any problems it finds
 */
func validateAndFixRange(rpcClient rpc.IRPCClient, s storage.IStorage, startBlock, endBlock *big.Int, fixBatchSize int) error {
	validator := orchestrator.NewValidator(rpcClient, s)

	err := validator.FindAndFixGaps(startBlock, endBlock)
	if err != nil {
		return err
	}

	_, invalidBlocks, err := validator.ValidateBlockRange(startBlock, endBlock)
	if err != nil {
		return err
	}

	invalidBlockNumbers := make([]*big.Int, 0)
	for i := range invalidBlocks {
		blockData := &invalidBlocks[i]
		invalidBlockNumbers = append(invalidBlockNumbers, blockData.Block.Number)
	}

	if len(invalidBlocks) > 0 {
		err = validator.FixBlocks(invalidBlockNumbers, fixBatchSize)
		if err != nil {
			return fmt.Errorf("failed to fix blocks: %w", err)
		}
	}

	log.Debug().Msgf("ValidationAndFix complete for range %v-%v", startBlock, endBlock)
	return nil
}
