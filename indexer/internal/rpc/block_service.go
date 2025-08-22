package rpc

import (
	"context"
	"fmt"
	"sync"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/thirdweb-dev/indexer/proto"
)

// BlockService manages a shared gRPC connection for block operations
type BlockService struct {
	conn        *grpc.ClientConn
	client      pb.BlockServiceClient
	mu          sync.RWMutex
	url         string
	isConnected bool
}

// NewBlockService creates a new BlockService with connection to MMN gRPC
func NewBlockService(url string) (*BlockService, error) {
	service := &BlockService{
		url: url,
	}
	
	if err := service.connect(); err != nil {
		return nil, fmt.Errorf("failed to create block service: %w", err)
	}
	
	return service, nil
}

// connect establishes gRPC connection
func (bs *BlockService) connect() error {
	bs.mu.Lock()
	defer bs.mu.Unlock()
	
	if bs.isConnected {
		return nil
	}
	
	conn, err := grpc.Dial(bs.url, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return fmt.Errorf("failed to connect to %s: %w", bs.url, err)
	}
	
	bs.conn = conn
	bs.client = pb.NewBlockServiceClient(conn)
	bs.isConnected = true
	
	return nil
}

// ensureConnection ensures the service is connected
func (bs *BlockService) ensureConnection() error {
	bs.mu.RLock()
	if bs.isConnected {
		bs.mu.RUnlock()
		return nil
	}
	bs.mu.RUnlock()
	
	return bs.connect()
}

// GetBlockByNumber retrieves blocks by their numbers
func (bs *BlockService) GetBlockByNumber(ctx context.Context, blockNumbers []uint64) (*pb.GetBlockByNumberResponse, error) {
	if err := bs.ensureConnection(); err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	
	if !bs.isConnected {
		return nil, fmt.Errorf("service not connected")
	}
	
	return bs.client.GetBlockByNumber(ctx, &pb.GetBlockByNumberRequest{
		BlockNumbers:        blockNumbers,
	})
}

// GetBlockNumber retrieves the latest block number
func (bs *BlockService) GetBlockNumber(ctx context.Context) (*pb.GetBlockNumberResponse, error) {
	if err := bs.ensureConnection(); err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	
	if !bs.isConnected {
		return nil, fmt.Errorf("service not connected")
	}
	
	return bs.client.GetBlockNumber(ctx, &pb.EmptyParams{})
}

// Close closes the gRPC connection
func (bs *BlockService) Close() error {
	bs.mu.Lock()
	defer bs.mu.Unlock()
	
	if bs.conn != nil {
		bs.isConnected = false
		return bs.conn.Close()
	}
	
	return nil
}

// IsConnected returns the connection status
func (bs *BlockService) IsConnected() bool {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	
	return bs.isConnected
}

// GetURL returns the service URL
func (bs *BlockService) GetURL() string {
	return bs.url
}
