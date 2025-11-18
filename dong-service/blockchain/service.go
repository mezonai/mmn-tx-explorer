package blockchain

import (
	"dong-service/logger"
	"sync"
)

var (
	instance *BlockchainService
	once     sync.Once
)

func InitBlockchainService(rpcURL string) error {
	var err error
	once.Do(func() {
		instance, err = NewBlockchainService(rpcURL)
		if err != nil {
			logger.Error().Err(err).Str("rpc_url", rpcURL).Msg("Failed to initialize blockchain service")
			return
		}
		logger.Info().Str("rpc_url", rpcURL).Msg("Blockchain service initialized successfully")
	})
	return err
}

func CloseBlockchainService() error {
	if instance != nil {
		return instance.Close()
	}
	return nil
}
