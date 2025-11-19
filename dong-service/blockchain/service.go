package blockchain

import (
	"dong-service/config"
	"dong-service/logger"
	"sync"
)

var (
	instance *BlockchainService
	once     sync.Once
)

func InitBlockchainService(config *config.Config) error {
	var err error
	once.Do(func() {
		instance, err = NewBlockchainService(config)
		if err != nil {
			logger.Error().Err(err).Str("rpc_url", config.Blockchain.RPCURL).Msg("Failed to initialize blockchain service")
			return
		}
		logger.Info().Str("rpc_url", config.Blockchain.RPCURL).Msg("Blockchain service initialized successfully")
	})
	return err
}

func CloseBlockchainService() error {
	if instance != nil {
		return instance.Close()
	}
	return nil
}
