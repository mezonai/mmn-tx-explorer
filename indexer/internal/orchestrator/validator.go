package orchestrator

import (
	"context"
	"fmt"
	"math/big"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/rs/zerolog/log"
)

type Validator struct {
	storage storage.IStorage
	rpc     rpc.IRPCClient
	poller  *Poller
}

func NewValidator(rpcClient rpc.IRPCClient, s storage.IStorage) *Validator {
	return &Validator{
		rpc:     rpcClient,
		storage: s,
		poller:  NewBoundlessPoller(rpcClient, s),
	}
}

// ValidateBlockRange godoc
// param startBlock - The start block number (inclusive)
// param endBlock - The end block number (inclusive)
// return error - An error if the validation fails
func (v *Validator) ValidateBlockRange(startBlock, endBlock *big.Int) (validBlocks, invalidBlocks []common.BlockData, err error) {
	dbData, err := v.storage.MainStorage.GetValidationBlockData(v.rpc.GetChainID(), startBlock, endBlock)
	if err != nil {
		return nil, nil, err
	}
	validBlocks, invalidBlocks, err = v.ValidateBlocks(dbData)
	if err != nil {
		return nil, nil, err
	}
	return validBlocks, invalidBlocks, nil
}

func (v *Validator) ValidateBlocks(blocks []common.BlockData) (validBlocks, invalidBlocks []common.BlockData, err error) {
	invalidBlocks = make([]common.BlockData, 0)
	validBlocks = make([]common.BlockData, 0)
	for i := range blocks {
		blockData := &blocks[i]
		valid, err := v.ValidateBlock(blockData)
		if err != nil {
			log.Error().Err(err).Msgf("Block verification failed for block %s", blockData.Block.Number)
			return nil, nil, err
		}
		if valid {
			validBlocks = append(validBlocks, *blockData)
		} else {
			invalidBlocks = append(invalidBlocks, *blockData)
		}
	}
	return validBlocks, invalidBlocks, nil
}

func (v *Validator) ValidateBlock(blockData *common.BlockData) (valid bool, err error) {
	if config.Cfg.Validation.Mode == "disabled" {
		return true, nil
	}

	// check that transaction count matches
	if blockData.Block.TransactionCount != uint64(len(blockData.Transactions)) {
		log.Error().Msgf("Block verification failed for block %s: transaction count mismatch: expected=%d, fetched from DB=%d", blockData.Block.Number, blockData.Block.TransactionCount, len(blockData.Transactions))
		return false, nil
	}

	return true, nil
}

func (v *Validator) FixBlocks(invalidBlocks []*big.Int, fixBatchSize int) error {
	if len(invalidBlocks) == 0 {
		log.Debug().Msg("No invalid blocks")
		return nil
	}

	if fixBatchSize == 0 {
		fixBatchSize = len(invalidBlocks)
	}

	log.Debug().Msgf("Fixing invalid blocks %d to %d", invalidBlocks[0], invalidBlocks[len(invalidBlocks)-1])

	// Process blocks in batches
	for i := 0; i < len(invalidBlocks); i += fixBatchSize {
		end := i + fixBatchSize
		if end > len(invalidBlocks) {
			end = len(invalidBlocks)
		}
		batch := invalidBlocks[i:end]

		polledBlocks, failedBlocks := v.poller.PollWithoutSaving(context.Background(), batch)
		log.Debug().Msgf("Batch of invalid blocks polled: %d to %d", batch[0], batch[len(batch)-1])
		if len(failedBlocks) > 0 {
			log.Error().Msgf("Failed to poll %d blocks: %v", len(failedBlocks), failedBlocks)
			return fmt.Errorf("failed to poll %d blocks: %v", len(failedBlocks), failedBlocks)
		}

		_, err := v.storage.MainStorage.ReplaceBlockData(polledBlocks)
		if err != nil {
			log.Error().Err(err).Msgf("Failed to replace blocks: %v", polledBlocks)
			return err
		}
	}
	log.Info().Msgf("Fixed %d blocks", len(invalidBlocks))
	return nil
}

func (v *Validator) FindAndFixGaps(startBlock, endBlock *big.Int) error {
	missingBlockNumbers, err := v.storage.MainStorage.FindMissingBlockNumbers(v.rpc.GetChainID(), startBlock, endBlock)
	if err != nil {
		return err
	}
	if len(missingBlockNumbers) == 0 {
		log.Debug().Msg("No missing blocks found")
		return nil
	}
	log.Debug().Msgf("Found %d missing blocks: %v", len(missingBlockNumbers), missingBlockNumbers)

	// query missing blocks
	polledBlocks, failedBlocks := v.poller.PollWithoutSaving(context.Background(), missingBlockNumbers)
	log.Debug().Msg("Missing blocks polled")
	if len(failedBlocks) > 0 {
		log.Error().Msgf("Failed to poll %d blocks: %v", len(failedBlocks), failedBlocks)
		return fmt.Errorf("failed to poll %d blocks: %v", len(failedBlocks), failedBlocks)
	}

	err = v.storage.MainStorage.InsertBlockData(polledBlocks)
	if err != nil {
		log.Error().Err(err).Msgf("Failed to insert missing blocks: %v", polledBlocks)
		return err
	}
	return nil
}
