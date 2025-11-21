package validation

import (
	"encoding/json"
	"fmt"
	"math/big"
	"os"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
)

type Cursor struct {
	LastScannedBlockNumber *big.Int
	MaxBlockNumber         *big.Int
	ChainID                *big.Int
}

func InitCursor(chainID *big.Int, store storage.IStorage) (*Cursor, error) {
	lastScannedBlock := getLastScannedBlock(chainID)
	maxBlockNumber, err := store.MainStorage.GetMaxBlockNumber(chainID)
	if err != nil {
		return nil, err
	}
	if maxBlockNumber == nil {
		maxBlockNumber = big.NewInt(0)
	}
	if lastScannedBlock.Cmp(maxBlockNumber) >= 0 {
		return nil, fmt.Errorf("last scanned block number is greater than or equal to max block number")
	}
	return &Cursor{
		LastScannedBlockNumber: lastScannedBlock,
		MaxBlockNumber:         maxBlockNumber,
		ChainID:                chainID,
	}, nil
}

func (c *Cursor) Update(blockNumber *big.Int) error {
	cursorFile := fmt.Sprintf("validation_cursor_%s.json", c.ChainID.String())
	jsonData, err := json.Marshal(blockNumber.String())
	if err != nil {
		return err
	}

	err = os.WriteFile(cursorFile, jsonData, 0o644)
	if err != nil {
		return err
	}
	c.LastScannedBlockNumber = blockNumber
	return nil
}

func getLastScannedBlock(chainID *big.Int) *big.Int {
	cursorFile := fmt.Sprintf("validation_cursor_%s.json", chainID.String())
	if _, err := os.Stat(cursorFile); err != nil {
		return big.NewInt(0)
	}

	fileData, err := os.ReadFile(cursorFile)
	if err != nil {
		return big.NewInt(0)
	}

	var lastBlock string
	err = json.Unmarshal(fileData, &lastBlock)
	if err != nil {
		return big.NewInt(0)
	}

	lastBlockBig := new(big.Int)
	lastBlockBig.SetString(lastBlock, 10)
	return lastBlockBig
}
