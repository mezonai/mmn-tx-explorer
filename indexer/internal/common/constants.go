package common

import "google.golang.org/grpc"

const (
	// GRPCMaxMessageSize defines the maximum message size for gRPC calls (50 MB)
	GRPCMaxMessageSize = 50 * 1024 * 1024
)

// GetGRPCCallOptions returns default gRPC call options with configured message size limits
func GetGRPCCallOptions() []grpc.CallOption {
	return []grpc.CallOption{
		grpc.MaxCallRecvMsgSize(GRPCMaxMessageSize),
		grpc.MaxCallSendMsgSize(GRPCMaxMessageSize),
	}
}
