package rpc

import (
	"context"
	"fmt"
	"sync"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/thirdweb-dev/indexer/proto"
)

// MMNGrpcService manages a shared gRPC connection for block operations
type MMNGrpcService struct {
	conn        *grpc.ClientConn
	blockClient      pb.BlockServiceClient
	txClient    pb.TxServiceClient
	accountClient pb.AccountServiceClient
	mu          sync.RWMutex
	url         string
	isConnected bool
}

// NewMMNGrpcService creates a new MMNGrpcService with connection to MMN gRPC
func NewMMNGrpcService(url string) (*MMNGrpcService, error) {
	service := &MMNGrpcService{
		url: url,
	}
	
	if err := service.connect(); err != nil {
		return nil, fmt.Errorf("failed to create block service: %w", err)
	}
	
	return service, nil
}

// connect establishes gRPC connection
func (mmn *MMNGrpcService) connect() error {
	mmn.mu.Lock()
	defer mmn.mu.Unlock()
	
	if mmn.isConnected {
		return nil
	}
	
	conn, err := grpc.Dial(mmn.url, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return fmt.Errorf("failed to connect to %s: %w", mmn.url, err)
	}
	
	mmn.conn = conn
	mmn.blockClient = pb.NewBlockServiceClient(conn)
	mmn.txClient = pb.NewTxServiceClient(conn)
	mmn.accountClient = pb.NewAccountServiceClient(conn)
	mmn.isConnected = true
	
	return nil
}

// ensureConnection ensures the service is connected
func (mmn *MMNGrpcService) ensureConnection() error {
	mmn.mu.RLock()
	if mmn.isConnected {
		mmn.mu.RUnlock()
		return nil
	}
	mmn.mu.RUnlock()
	
	return mmn.connect()
}

// GetBlockByNumber retrieves blocks by their numbers
func (mmn *MMNGrpcService) GetBlockByNumber(ctx context.Context, blockNumbers []uint64) (*pb.GetBlockByNumberResponse, error) {
	if err := mmn.ensureConnection(); err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	
	mmn.mu.RLock()
	defer mmn.mu.RUnlock()
	
	if !mmn.isConnected {
		return nil, fmt.Errorf("service not connected")
	}
	
	return mmn.blockClient.GetBlockByNumber(ctx, &pb.GetBlockByNumberRequest{
		BlockNumbers:        blockNumbers,
	})
}

// GetBlockNumber retrieves the latest block number
func (mmn *MMNGrpcService) GetBlockNumber(ctx context.Context) (*pb.GetBlockNumberResponse, error) {
	if err := mmn.ensureConnection(); err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	
	mmn.mu.RLock()
	defer mmn.mu.RUnlock()
	
	if !mmn.isConnected {
		return nil, fmt.Errorf("service not connected")
	}
	
	return mmn.blockClient.GetBlockNumber(ctx, &pb.EmptyParams{})
}

// GetAccountByAddress retrieves an account by address
func (mmn *MMNGrpcService) GetAccountByAddress(ctx context.Context, address string) (*pb.GetAccountByAddressResponse, error) {
	if err := mmn.ensureConnection(); err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}

	mmn.mu.RLock()
	defer mmn.mu.RUnlock()

	if !mmn.isConnected {
		return nil, fmt.Errorf("service not connected")
	}

	return mmn.accountClient.GetAccountByAddress(ctx, &pb.GetAccountByAddressRequest{Address: address})
}

// GetPendingTransactions retrieves all pending transactions from mempool
func (mmn *MMNGrpcService) GetPendingTransactions(ctx context.Context) (*pb.GetPendingTransactionsResponse, error) {
	if err := mmn.ensureConnection(); err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}

	mmn.mu.RLock()
	defer mmn.mu.RUnlock()

	if !mmn.isConnected {
		return nil, fmt.Errorf("service not connected")
	}

	return mmn.txClient.GetPendingTransactions(ctx, &pb.GetPendingTransactionsRequest{})
}

// Close closes the gRPC connection
func (mmn *MMNGrpcService) Close() error {
	mmn.mu.Lock()
	defer mmn.mu.Unlock()
	
	if mmn.conn != nil {
		mmn.isConnected = false
		return mmn.conn.Close()
	}
	
	return nil
}

// IsConnected returns the connection status
func (mmn *MMNGrpcService) IsConnected() bool {
	mmn.mu.RLock()
	defer mmn.mu.RUnlock()
	
	return mmn.isConnected
}

// GetURL returns the service URL
func (mmn *MMNGrpcService) GetURL() string {
	return mmn.url
}
