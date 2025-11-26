package services

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/repository"
	"time"
)

type StartupInitializer struct {
	walletPoolService *WalletPoolService
}

func NewStartupInitializer(dongSchema string) *StartupInitializer {
	db := database.GetDB()
	redEnvelopeWalletRepo := repository.NewIntermediaryWalletRepository(db, dongSchema)
	walletPoolService := NewWalletPoolService(redEnvelopeWalletRepo)

	return &StartupInitializer{
		walletPoolService: walletPoolService,
	}
}

func (s *StartupInitializer) Initialize() error {
	ctx := context.Background()
	logger.Info().Msg("Initializing Red Envelope Wallet Pool...")
	err := s.initializeWalletPool(ctx)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to initialize wallet pool")
		return err
	}
	logger.Info().Msg("Wallet pool initialized successfully")

	logger.Info().Msg("Checking wallet pool health...")
	err = s.checkPoolHealth(ctx)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to check pool health")
		return err
	}
	logger.Info().Msg("Wallet pool health check completed")
	return nil
}

func (s *StartupInitializer) initializeWalletPool(ctx context.Context) error {
	err := s.walletPoolService.InitializePoolIfNeeded(ctx)
	if err != nil {
		return err
	}

	stats, err := s.walletPoolService.redEnvelopeWalletRepo.GetPoolStatistics(ctx)
	if err != nil {
		logger.Warn().Err(err).Msg("Could not retrieve final statistics")
		return nil
	}

	logger.Info().
		Interface("pool_stats", stats).
		Msg("Wallet pool initialization complete")

	return nil
}

func (s *StartupInitializer) checkPoolHealth(ctx context.Context) error {
	minReady := constants.RedEnvelopeInitialWalletPool / 5

	err := s.walletPoolService.EnsureMinimumWallets(ctx, minReady)
	if err != nil {
		return err
	}

	return nil
}

func (s *StartupInitializer) StartBackgroundMaintenance() {
	logger.Info().Msg("Starting background wallet pool maintenance")

	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			ctx := context.Background()
			logger.Info().Msg("Running scheduled wallet pool health check")

			minReady := constants.RedEnvelopeInitialWalletPool / 5
			err := s.walletPoolService.EnsureMinimumWallets(ctx, minReady)
			if err != nil {
				logger.Error().
					Err(err).
					Msg("Scheduled wallet pool health check failed")
			} else {
				logger.Info().Msg("Scheduled wallet pool health check completed")
			}
		}
	}()
}
