package orchestrator

import (
	"context"
	"fmt"
	"math/big"
	"testing"
	"time"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	mocks "github.com/mezonai/mmn-tx-explorer/indexer/test/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Publisher interface for testing
type PublisherInterface interface {
	PublishBlockData(data []common.BlockData) error
	Close() error
}

// Helper function to create storage with proper interface
func createMockStorage(t *testing.T) (storage.IStorage, *mocks.MockIMainStorage, *mocks.MockIStagingStorage) {
	mockMainStorage := mocks.NewMockIMainStorage(t)
	mockStagingStorage := mocks.NewMockIStagingStorage(t)

	mockStorage := storage.IStorage{
		MainStorage:    interface{}(mockMainStorage).(storage.IMainStorage),
		StagingStorage: mockStagingStorage,
	}

	return mockStorage, mockMainStorage, mockStagingStorage
}

func TestNewCommitter(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill

	assert.NotNil(t, committer)
	assert.Equal(t, DEFAULT_COMMITTER_TRIGGER_INTERVAL, committer.triggerIntervalMs)
	assert.Equal(t, DEFAULT_BLOCKS_PER_COMMIT, committer.blocksPerCommit)
}

func TestGetBlockNumbersToCommit(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(100), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(101), blockNumbers[0])
	assert.Equal(t, big.NewInt(100+int64(committer.blocksPerCommit)), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToCommitWithoutConfiguredAndNotStored(t *testing.T) {
	// start from 0
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(0), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(0), blockNumbers[0])
	assert.Equal(t, big.NewInt(int64(committer.blocksPerCommit)-1), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToCommitWithConfiguredAndNotStored(t *testing.T) {
	// start from configured
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.FromBlock = 50

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(0), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(50), blockNumbers[0])
	assert.Equal(t, big.NewInt(50+int64(committer.blocksPerCommit)-1), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToCommitWithConfiguredAndStored(t *testing.T) {
	// start from stored + 1
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.FromBlock = 50

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(2000), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(2001), blockNumbers[0])
	assert.Equal(t, big.NewInt(2000+int64(committer.blocksPerCommit)), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToCommitWithoutConfiguredAndStored(t *testing.T) {
	// start from stored + 1
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(2000), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(2001), blockNumbers[0])
	assert.Equal(t, big.NewInt(2000+int64(committer.blocksPerCommit)), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToCommitWithStoredHigherThanInMemory(t *testing.T) {
	// start from stored + 1
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.FromBlock = 100

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(2000), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(2001), blockNumbers[0])
	assert.Equal(t, big.NewInt(2000+int64(committer.blocksPerCommit)), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToCommitWithStoredLowerThanInMemory(t *testing.T) {
	// return empty array
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.FromBlock = 100

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(99), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, 0, len(blockNumbers))
}

func TestGetBlockNumbersToCommitWithStoredEqualThanInMemory(t *testing.T) {
	// start from stored + 1
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.FromBlock = 2000

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(2000), nil)

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(2001), blockNumbers[0])
	assert.Equal(t, big.NewInt(2000+int64(committer.blocksPerCommit)), blockNumbers[len(blockNumbers)-1])
}

func TestGetSequentialBlockDataToCommit(t *testing.T) {
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.BlocksPerCommit = 3

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(100), nil)

	blockData := []common.BlockData{
		{Block: common.Block{Number: big.NewInt(101)}},
		{Block: common.Block{Number: big.NewInt(102)}},
		{Block: common.Block{Number: big.NewInt(103)}},
	}
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(101), big.NewInt(102), big.NewInt(103)},
	}).Return(blockData, nil)

	result, err := committer.getSequentialBlockDataToCommit(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 3, len(result))
}

func TestGetSequentialBlockDataToCommitWithDuplicateBlocks(t *testing.T) {
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.BlocksPerCommit = 3

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(100), nil)

	blockData := []common.BlockData{
		{Block: common.Block{Number: big.NewInt(101)}},
		{Block: common.Block{Number: big.NewInt(102)}},
		{Block: common.Block{Number: big.NewInt(102)}},
		{Block: common.Block{Number: big.NewInt(103)}},
		{Block: common.Block{Number: big.NewInt(103)}},
	}
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(101), big.NewInt(102), big.NewInt(103)},
	}).Return(blockData, nil)

	result, err := committer.getSequentialBlockDataToCommit(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 3, len(result))
	assert.Equal(t, big.NewInt(101), result[0].Block.Number)
	assert.Equal(t, big.NewInt(102), result[1].Block.Number)
	assert.Equal(t, big.NewInt(103), result[2].Block.Number)
}

func TestCommitDeletesAfterPublish(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill

	chainID := big.NewInt(1)
	blockData := []common.BlockData{
		{Block: common.Block{ChainId: chainID, Number: big.NewInt(101)}},
		{Block: common.Block{ChainId: chainID, Number: big.NewInt(102)}},
	}

	deleteDone := make(chan struct{})

	committer.lastPublishedBlock.Store(102)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().InsertBlockData(blockData).Return(nil)
	mockStagingStorage.EXPECT().DeleteOlderThan(chainID, big.NewInt(102)).RunAndReturn(func(*big.Int, *big.Int) error {
		close(deleteDone)
		return nil
	})

	err := committer.commit(blockData)
	assert.NoError(t, err)

	select {
	case <-deleteDone:
	case <-time.After(2 * time.Second):
		t.Fatal("DeleteOlderThan was not called within timeout period")
	}
}

func TestCommitParallelPublisherMode(t *testing.T) {
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Publisher.Mode = "parallel"

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeLive

	chainID := big.NewInt(1)
	blockData := []common.BlockData{
		{Block: common.Block{ChainId: chainID, Number: big.NewInt(101)}},
		{Block: common.Block{ChainId: chainID, Number: big.NewInt(102)}},
	}

	mockMainStorage.EXPECT().InsertBlockData(blockData).Return(nil)

	err := committer.commit(blockData)
	assert.NoError(t, err)

	mockStagingStorage.AssertNotCalled(t, "GetLastPublishedBlockNumber", mock.Anything)
	mockStagingStorage.AssertNotCalled(t, "SetLastPublishedBlockNumber", mock.Anything, mock.Anything)
	mockStagingStorage.AssertNotCalled(t, "DeleteOlderThan", mock.Anything, mock.Anything)
}

func TestCleanupProcessedStagingBlocks(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)

	chainID := big.NewInt(1)
	committer.lastCommittedBlock.Store(100)
	committer.lastPublishedBlock.Store(0)

	committer.cleanupProcessedStagingBlocks()
	mockStagingStorage.AssertNotCalled(t, "DeleteOlderThan", mock.Anything, mock.Anything)

	committer.lastPublishedBlock.Store(90)
	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().DeleteOlderThan(chainID, big.NewInt(90)).Return(nil)
	committer.cleanupProcessedStagingBlocks()
}
func TestHandleGap(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill

	expectedStartBlockNumber := big.NewInt(100)
	actualFirstBlock := common.Block{Number: big.NewInt(105)}

	mockRPC.EXPECT().GetBlocksPerRequest().Return(rpc.BlocksPerRequestConfig{
		Blocks: 5,
	})
	mockRPC.EXPECT().GetFullBlocks(context.Background(), []*big.Int{big.NewInt(100), big.NewInt(101), big.NewInt(102), big.NewInt(103), big.NewInt(104)}).Return([]rpc.GetFullBlockResult{
		{BlockNumber: big.NewInt(100), Data: common.BlockData{Block: common.Block{Number: big.NewInt(100)}}},
		{BlockNumber: big.NewInt(101), Data: common.BlockData{Block: common.Block{Number: big.NewInt(101)}}},
		{BlockNumber: big.NewInt(102), Data: common.BlockData{Block: common.Block{Number: big.NewInt(102)}}},
		{BlockNumber: big.NewInt(103), Data: common.BlockData{Block: common.Block{Number: big.NewInt(103)}}},
		{BlockNumber: big.NewInt(104), Data: common.BlockData{Block: common.Block{Number: big.NewInt(104)}}},
	})
	mockStagingStorage.EXPECT().InsertStagingData(mock.Anything).Return(nil)

	err := committer.handleGap(context.Background(), expectedStartBlockNumber, actualFirstBlock)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "first block number (105) in commit batch does not match expected (100)")
}

func TestNewCommitterWithOptions(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, _ := createMockStorage(t)

	workModeChan := make(chan WorkMode, 1)
	validator := &Validator{}

	committer := NewCommitter(mockRPC, mockStorage,
		WithCommitterWorkModeChan(workModeChan),
		WithValidator(validator),
	)

	assert.NotNil(t, committer)
	assert.Equal(t, workModeChan, committer.workModeChan)
	assert.Equal(t, validator, committer.validator)
	assert.Equal(t, DEFAULT_COMMITTER_TRIGGER_INTERVAL, committer.triggerIntervalMs)
	assert.Equal(t, DEFAULT_BLOCKS_PER_COMMIT, committer.blocksPerCommit)
}

func TestGetBlockNumbersToPublish(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(big.NewInt(100), nil)

	blockNumbers, err := committer.getBlockNumbersToPublish(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(101), blockNumbers[0])
	assert.Equal(t, big.NewInt(100+int64(committer.blocksPerCommit)), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToPublishWithoutConfiguredAndNotStored(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(big.NewInt(0), nil)

	blockNumbers, err := committer.getBlockNumbersToPublish(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, committer.blocksPerCommit, len(blockNumbers))
	assert.Equal(t, big.NewInt(0), blockNumbers[0])
	assert.Equal(t, big.NewInt(int64(committer.blocksPerCommit)-1), blockNumbers[len(blockNumbers)-1])
}

func TestGetBlockNumbersToPublishWithStoredLowerThanInMemory(t *testing.T) {
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.FromBlock = 100

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(big.NewInt(99), nil)

	blockNumbers, err := committer.getBlockNumbersToPublish(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, 0, len(blockNumbers))
}

func TestGetBlockToCommitUntilBackfillMode(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	committer.blocksPerCommit = 100

	latestCommittedBlockNumber := big.NewInt(1000)
	endBlock, err := committer.getBlockToCommitUntil(context.Background(), latestCommittedBlockNumber)

	assert.NoError(t, err)
	assert.Equal(t, big.NewInt(1100), endBlock)
}

func TestGetBlockToCommitUntilLiveMode(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeLive
	committer.blocksPerCommit = 100

	latestCommittedBlockNumber := big.NewInt(1000)
	mockRPC.EXPECT().GetLatestBlockNumber(context.Background()).Return(big.NewInt(1050), nil)

	endBlock, err := committer.getBlockToCommitUntil(context.Background(), latestCommittedBlockNumber)

	assert.NoError(t, err)
	assert.Equal(t, big.NewInt(1050), endBlock)
}

func TestGetBlockToCommitUntilLiveModeWithHigherRPCBlock(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeLive
	committer.blocksPerCommit = 100

	latestCommittedBlockNumber := big.NewInt(1000)
	mockRPC.EXPECT().GetLatestBlockNumber(context.Background()).Return(big.NewInt(1200), nil)

	endBlock, err := committer.getBlockToCommitUntil(context.Background(), latestCommittedBlockNumber)

	assert.NoError(t, err)
	assert.Equal(t, big.NewInt(1100), endBlock)
}

func TestFetchBlockDataBackfillMode(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	blockNumbers := []*big.Int{big.NewInt(101), big.NewInt(102)}
	expectedBlockData := []common.BlockData{
		{Block: common.Block{Number: big.NewInt(101)}},
		{Block: common.Block{Number: big.NewInt(102)}},
	}

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: blockNumbers,
	}).Return(expectedBlockData, nil)

	result, err := committer.fetchBlockData(context.Background(), blockNumbers)

	assert.NoError(t, err)
	assert.Equal(t, expectedBlockData, result)
}

func TestFetchBlockDataBackfillModeEmptyResult(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	blockNumbers := []*big.Int{big.NewInt(101), big.NewInt(102)}

	mockRPC.EXPECT().GetChainID().Return(chainID).Times(2) // Called once in fetchBlockData, once in handleMissingStagingData
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: blockNumbers,
	}).Return([]common.BlockData{}, nil)
	mockStagingStorage.EXPECT().GetLastStagedBlockNumber(chainID, big.NewInt(102), big.NewInt(0)).Return(nil, nil)

	result, err := committer.fetchBlockData(context.Background(), blockNumbers)

	assert.NoError(t, err)
	assert.Nil(t, result)
}

func TestGetSequentialBlockDataWithGap(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	blockNumbers := []*big.Int{big.NewInt(101), big.NewInt(102), big.NewInt(103)}
	blockData := []common.BlockData{
		{Block: common.Block{Number: big.NewInt(101)}},
		{Block: common.Block{Number: big.NewInt(103)}}, // Gap at 102
	}

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: blockNumbers,
	}).Return(blockData, nil)

	result, err := committer.getSequentialBlockData(context.Background(), blockNumbers)

	assert.NoError(t, err)
	assert.Equal(t, 1, len(result))
	assert.Equal(t, big.NewInt(101), result[0].Block.Number)
}

func TestGetSequentialBlockDataToPublish(t *testing.T) {
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.BlocksPerCommit = 3

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(big.NewInt(100), nil)

	blockData := []common.BlockData{
		{Block: common.Block{Number: big.NewInt(101)}},
		{Block: common.Block{Number: big.NewInt(102)}},
		{Block: common.Block{Number: big.NewInt(103)}},
	}
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(101), big.NewInt(102), big.NewInt(103)},
	}).Return(blockData, nil)

	result, err := committer.getSequentialBlockDataToPublish(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 3, len(result))
}

func TestPublish(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	committer.blocksPerCommit = 2 // Set small value for testing
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID).Times(3) // Called in getBlockNumbersToPublish, fetchBlockData, and publish
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(big.NewInt(100), nil)

	blockData := []common.BlockData{
		{Block: common.Block{Number: big.NewInt(101)}},
		{Block: common.Block{Number: big.NewInt(102)}},
	}
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(101), big.NewInt(102)},
	}).Return(blockData, nil)

	// Since publisher is disabled by default in tests, it won't actually call PublishBlockData
	// The test should verify that publish succeeds when publisher is disabled
	mockStagingStorage.EXPECT().SetLastPublishedBlockNumber(chainID, big.NewInt(102)).Return(nil)

	err := committer.publish(context.Background())

	assert.NoError(t, err)
}

func TestPublishEmptyData(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	committer.blocksPerCommit = 2 // Set small value for testing
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID).Times(3) // Called in getBlockNumbersToPublish, fetchBlockData, and handleMissingStagingData
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(big.NewInt(100), nil)

	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(101), big.NewInt(102)},
	}).Return([]common.BlockData{}, nil)
	mockStagingStorage.EXPECT().GetLastStagedBlockNumber(chainID, big.NewInt(102), big.NewInt(0)).Return(nil, nil)

	err := committer.publish(context.Background())

	assert.NoError(t, err)
}

func TestHandleMissingStagingData(t *testing.T) {
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.BlocksPerCommit = 5

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill

	chainID := big.NewInt(1)
	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockRPC.EXPECT().GetBlocksPerRequest().Return(rpc.BlocksPerRequestConfig{
		Blocks: 100,
	})
	mockRPC.EXPECT().GetFullBlocks(context.Background(), []*big.Int{big.NewInt(0), big.NewInt(1), big.NewInt(2), big.NewInt(3), big.NewInt(4)}).Return([]rpc.GetFullBlockResult{
		{BlockNumber: big.NewInt(0), Data: common.BlockData{Block: common.Block{Number: big.NewInt(0)}}},
		{BlockNumber: big.NewInt(1), Data: common.BlockData{Block: common.Block{Number: big.NewInt(1)}}},
		{BlockNumber: big.NewInt(2), Data: common.BlockData{Block: common.Block{Number: big.NewInt(2)}}},
		{BlockNumber: big.NewInt(3), Data: common.BlockData{Block: common.Block{Number: big.NewInt(3)}}},
		{BlockNumber: big.NewInt(4), Data: common.BlockData{Block: common.Block{Number: big.NewInt(4)}}},
	})
	mockStagingStorage.EXPECT().InsertStagingData(mock.Anything).Return(nil)

	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(0), nil)
	expectedEndBlock := big.NewInt(4)
	mockStagingStorage.EXPECT().GetLastStagedBlockNumber(chainID, expectedEndBlock, big.NewInt(0)).Return(big.NewInt(20), nil)

	blockData := []common.BlockData{}
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(0), big.NewInt(1), big.NewInt(2), big.NewInt(3), big.NewInt(4)},
	}).Return(blockData, nil)

	result, err := committer.getSequentialBlockDataToCommit(context.Background())

	assert.NoError(t, err)
	assert.Nil(t, result)
}

func TestHandleMissingStagingDataIsPolledWithCorrectBatchSize(t *testing.T) {
	defer func() { config.Cfg = config.Config{} }()
	config.Cfg.Committer.BlocksPerCommit = 5
	config.Cfg.Poller.BlocksPerPoll = 3

	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill

	chainID := big.NewInt(1)
	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockRPC.EXPECT().GetBlocksPerRequest().Return(rpc.BlocksPerRequestConfig{
		Blocks: 3,
	})
	mockRPC.EXPECT().GetFullBlocks(context.Background(), []*big.Int{big.NewInt(0), big.NewInt(1), big.NewInt(2)}).Return([]rpc.GetFullBlockResult{
		{BlockNumber: big.NewInt(0), Data: common.BlockData{Block: common.Block{Number: big.NewInt(0)}}},
		{BlockNumber: big.NewInt(1), Data: common.BlockData{Block: common.Block{Number: big.NewInt(1)}}},
		{BlockNumber: big.NewInt(2), Data: common.BlockData{Block: common.Block{Number: big.NewInt(2)}}},
	})
	mockStagingStorage.EXPECT().InsertStagingData(mock.Anything).Return(nil)

	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(big.NewInt(0), nil)
	expectedEndBlock := big.NewInt(4)
	mockStagingStorage.EXPECT().GetLastStagedBlockNumber(chainID, expectedEndBlock, big.NewInt(0)).Return(big.NewInt(20), nil)

	blockData := []common.BlockData{}
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(0), big.NewInt(1), big.NewInt(2), big.NewInt(3), big.NewInt(4)},
	}).Return(blockData, nil)

	result, err := committer.getSequentialBlockDataToCommit(context.Background())

	assert.NoError(t, err)
	assert.Nil(t, result)
}

// Additional error handling tests
func TestGetBlockNumbersToCommitWithError(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockMainStorage.EXPECT().GetMaxBlockNumber(chainID).Return(nil, fmt.Errorf("storage error"))

	blockNumbers, err := committer.getBlockNumbersToCommit(context.Background())

	assert.Error(t, err)
	assert.Nil(t, blockNumbers)
	assert.Contains(t, err.Error(), "storage error")
}

func TestGetBlockNumbersToPublishWithError(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(nil, fmt.Errorf("staging error"))

	blockNumbers, err := committer.getBlockNumbersToPublish(context.Background())

	assert.Error(t, err)
	assert.Nil(t, blockNumbers)
	assert.Contains(t, err.Error(), "staging error")
}

func TestGetBlockToCommitUntilWithError(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeLive
	committer.blocksPerCommit = 100

	latestCommittedBlockNumber := big.NewInt(1000)
	mockRPC.EXPECT().GetLatestBlockNumber(context.Background()).Return(nil, fmt.Errorf("RPC error"))

	endBlock, err := committer.getBlockToCommitUntil(context.Background(), latestCommittedBlockNumber)

	assert.Error(t, err)
	assert.Nil(t, endBlock)
	assert.Contains(t, err.Error(), "RPC error")
}

func TestFetchBlockDataWithError(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	chainID := big.NewInt(1)

	blockNumbers := []*big.Int{big.NewInt(101), big.NewInt(102)}

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: blockNumbers,
	}).Return(nil, fmt.Errorf("staging error"))

	result, err := committer.fetchBlockData(context.Background(), blockNumbers)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "staging error")
}

func TestCommitWithError(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, mockMainStorage, _ := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill

	chainID := big.NewInt(1)
	blockData := []common.BlockData{
		{Block: common.Block{ChainId: chainID, Number: big.NewInt(101)}},
		{Block: common.Block{ChainId: chainID, Number: big.NewInt(102)}},
	}

	mockMainStorage.EXPECT().InsertBlockData(blockData).Return(fmt.Errorf("insert error"))

	err := committer.commit(blockData)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "insert error")
}

func TestPublishWithDisabledPublisher(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)
	committer.workMode = WorkModeBackfill
	committer.blocksPerCommit = 2 // Set small value for testing
	chainID := big.NewInt(1)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().GetLastPublishedBlockNumber(chainID).Return(big.NewInt(100), nil)

	blockData := []common.BlockData{
		{Block: common.Block{Number: big.NewInt(101)}},
		{Block: common.Block{Number: big.NewInt(102)}},
	}
	mockStagingStorage.EXPECT().GetStagingData(storage.QueryFilter{
		ChainId:      chainID,
		BlockNumbers: []*big.Int{big.NewInt(101), big.NewInt(102)},
	}).Return(blockData, nil)

	// Test that publish succeeds when publisher is disabled (default in test environment)
	// This verifies that the publish method handles the disabled publisher case correctly
	mockStagingStorage.EXPECT().SetLastPublishedBlockNumber(chainID, big.NewInt(102)).Return(nil)

	err := committer.publish(context.Background())

	assert.NoError(t, err)
}

func TestCleanupProcessedStagingBlocksWithError(t *testing.T) {
	mockRPC := mocks.NewMockIRPCClient(t)
	mockStorage, _, mockStagingStorage := createMockStorage(t)

	committer := NewCommitter(mockRPC, mockStorage)

	chainID := big.NewInt(1)
	committer.lastCommittedBlock.Store(100)
	committer.lastPublishedBlock.Store(90)

	mockRPC.EXPECT().GetChainID().Return(chainID)
	mockStagingStorage.EXPECT().DeleteOlderThan(chainID, big.NewInt(90)).Return(fmt.Errorf("delete error"))

	// Should not panic even with error
	committer.cleanupProcessedStagingBlocks()
}
