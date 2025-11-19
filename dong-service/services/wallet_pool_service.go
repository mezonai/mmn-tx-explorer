package services

import (
	"context"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"fmt"
	"sync"

	"golang.org/x/sync/errgroup"
)

type WalletPoolService struct {
	redEnvelopeWalletRepo *repository.RedEnvelopeWalletRepository
	mu                    sync.Mutex
}

func NewWalletPoolService(redEnvelopeWalletRepo *repository.RedEnvelopeWalletRepository) *WalletPoolService {
	return &WalletPoolService{
		redEnvelopeWalletRepo: redEnvelopeWalletRepo,
	}
}

func (s *WalletPoolService) InitializePoolIfNeeded(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	logger.Info().Msg("Checking wallet pool status...")

	stats, err := s.redEnvelopeWalletRepo.GetPoolStatistics(ctx)
	if err != nil {
		return fmt.Errorf("failed to get pool statistics: %w", err)
	}

	totalWallets := 0
	for _, count := range stats {
		totalWallets += count
	}

	logger.Info().
		Int("total_wallets", totalWallets).
		Interface("stats", stats).
		Msg("Current wallet pool status")

	if totalWallets < constants.RedEnvelopeInitialWalletPool {
		needed := constants.RedEnvelopeInitialWalletPool - totalWallets
		logger.Info().
			Int("needed", needed).
			Msg("Initializing wallet pool")

		err := s.CreateWallets(ctx, needed)
		if err != nil {
			return fmt.Errorf("failed to create wallets: %w", err)
		}

		logger.Info().
			Int("created", needed).
			Msg("Successfully initialized wallet pool")
	} else {
		logger.Info().Msg("Wallet pool already initialized, skipping...")
	}

	return nil
}

func (s *WalletPoolService) CreateWallets(ctx context.Context, count int) error {
  wallets := make([]*models.RedEnvelopeWallet, count)
	g, groupCtx := errgroup.WithContext(ctx)
	sem := make(chan struct{}, count) 

	for i := 0; i < count; i++ {
			if err := groupCtx.Err(); err != nil {
					return err
			}
			i := i 
			sem <- struct{}{} 
			g.Go(func() error {
					defer func() { <-sem }() 

					address, privateKey, err := s.generateWallet()
					if err != nil {
							return err
					}
					encryptedKey, err := utils.EncryptPrivateKey(privateKey)
					if err != nil {
							return err
					}

					wallets[i] = &models.RedEnvelopeWallet{
							WalletAddress:       address,
							EncryptedPrivateKey: encryptedKey,
							Status:              constants.RedEnvelopeWalletStatusReady,
					}
					return nil
			})
	}

	if err := g.Wait(); err != nil {
			return err
	}

	return s.redEnvelopeWalletRepo.CreateWallets(ctx, wallets)
}

func (s *WalletPoolService) EnsureMinimumWallets(ctx context.Context, minReady int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	availableCount, err := s.redEnvelopeWalletRepo.CountAvailableWallets(ctx)
	if err != nil {
		return fmt.Errorf("failed to count available wallets: %w", err)
	}

	if availableCount < minReady {
		needed := minReady - availableCount
		logger.Warn().
			Int("available", availableCount).
			Int("needed", needed).
			Msg("Wallet pool below minimum, creating more wallets")

		err := s.CreateWallets(ctx, needed)
		if err != nil {
			return fmt.Errorf("failed to create wallets: %w", err)
		}
	}

	return nil
}

func (s *WalletPoolService) generateWallet() (address string, privateKey string, error error) {
	publicKey, privateKey, err := utils.GenerateEphemeralKeyPair()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to generate Ed25519 key pair")
		return "", "", fmt.Errorf("failed to generate key pair: %w", err)
	}

	return publicKey, privateKey, nil
}
