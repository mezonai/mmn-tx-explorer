package services

import (
	"context"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"fmt"
)

type HotWalletSwapService struct {
	hotWalletSwapRepository *repository.HotWalletSwapRepository
}

func NewHotWalletSwapService(hotWalletSwapRepository *repository.HotWalletSwapRepository) *HotWalletSwapService {
	return &HotWalletSwapService{
		hotWalletSwapRepository: hotWalletSwapRepository,
	}
}

func (s *HotWalletSwapService) CreateHotWalletSwap(ctx context.Context) error {
	address, privateKey, err := s.generateWallet()
	if err != nil {
		return fmt.Errorf("failed to generate wallet: %w", err)
	}

	encryptedKey, err := utils.EncryptPrivateKey(privateKey)
	if err != nil {
		return fmt.Errorf("failed to encrypt private key: %w", err)
	}

	wallet := &models.HotWalletSwap{
		WalletAddress:       address,
		EncryptedPrivateKey: encryptedKey,
	}
	err = s.hotWalletSwapRepository.CreateWallet(ctx, wallet)
	if err != nil {
		return fmt.Errorf("failed to create hot wallet swap: %w", err)
	}
	return nil
}

func (s *HotWalletSwapService) generateWallet() (address string, privateKey string, error error) {
	publicKey, privateKey, err := utils.GenerateEphemeralKeyPair()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to generate Ed25519 key pair")
		return "", "", fmt.Errorf("failed to generate key pair: %w", err)
	}

	logger.Info().
		Str("address", publicKey).
		Msg("Generated new wallet successfully")

	return publicKey, privateKey, nil
}

func (s *HotWalletSwapService) InitializeHotWalletSwap(ctx context.Context) error {
	existingWallet, err := s.hotWalletSwapRepository.GetHotWalletSwap(ctx)
	if err == nil && existingWallet != nil {
		logger.Info().Str("wallet_address", existingWallet.WalletAddress).Msg("Hot wallet already exists, skipping creation")
		return nil
	}

	logger.Info().Msg("Creating new hot wallet")
	err = s.CreateHotWalletSwap(ctx)
	if err != nil {
		return fmt.Errorf("failed to create wallet: %w", err)
	}
	return nil
}
