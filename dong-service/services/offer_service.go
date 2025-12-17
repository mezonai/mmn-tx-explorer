package services

import (
	"context"
	"database/sql"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
)

type OfferService struct {
	repo           *repository.OfferRepository
	walletRepo     *repository.IntermediaryWalletRepository
	userWalletRepo *repository.WalletRepository
	orderRepo      *repository.OrderRepository
	blockchain     *blockchain.BlockchainService
}

func NewOfferService(repo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository, userWalletRepo *repository.WalletRepository, orderRepo *repository.OrderRepository, blockchain *blockchain.BlockchainService) *OfferService {
	return &OfferService{repo: repo, walletRepo: walletRepo, userWalletRepo: userWalletRepo, orderRepo: orderRepo, blockchain: blockchain}
}

type IOfferService interface {
	CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string, sellerUserID int64) (*models.Offer, error)
	ListOffers(ctx context.Context, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error)
	CountOffers(ctx context.Context, walletAddress *string, fromAmount *string, toAmount *string) (int64, error)
	GetOfferByID(ctx context.Context, id int64) (*models.Offer, error)
	GetOffersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any, fromAmount *string, toAmount *string) ([]models.Offer, int64, error)
	UpdateOfferStatus(ctx context.Context, req *models.UpdateOfferStatusRequest) error
}

func (s *OfferService) CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string, sellerUserID int64) (*models.Offer, error) {
	amountInt := req.Amount

	if s.userWalletRepo != nil {
		userWallet, err := s.userWalletRepo.GetByAddress(walletAddr)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Warn().Str("wallet", walletAddr).Msg("Wallet not indexed yet, skipping balance check")
			} else {
				return nil, fmt.Errorf("failed to get wallet balance: %w", err)
			}
		} else {
			balanceInt, parseErr := strconv.ParseInt(userWallet.Balance, 10, 64)
			if parseErr != nil {
				return nil, fmt.Errorf("invalid wallet balance format: %w", parseErr)
			}

			requiredBalance := amountInt * 1000000
			if balanceInt < requiredBalance {
				return nil, fmt.Errorf("insufficient balance: have %d, need %d", balanceInt, requiredBalance)
			}
		}
	}

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	var walletID int64
	var intermediaryAddr string
	wallet, err := s.walletRepo.GetOrCreateAvailableWallet(ctx, tx, constants.WalletTypeOffer)
	if err != nil {
		err = fmt.Errorf("failed to get or create intermediary wallet: %w", err)
		return nil, err
	}
	walletID = wallet.ID
	intermediaryAddr = wallet.WalletAddress

	if err = s.walletRepo.UpdateIntermediaryWalletStatus(tx, ctx, walletID, constants.WalletTypeOffer); err != nil {
		err = fmt.Errorf("failed to update intermediary wallet: %w", err)
		return nil, err
	}

	var priceInt int64 = 0

	var bankInfoStr *string
	if req.BankInfo != nil {
		b, marshalErr := json.Marshal(req.BankInfo)
		if marshalErr != nil {
			err = fmt.Errorf("invalid bank info: %w", marshalErr)
			return nil, err
		}
		ms := string(b)
		bankInfoStr = &ms
	}

	var limitMinInt int64 = 1
	var limitMaxInt int64 = amountInt
	if req.Limit != nil {
		limitMinInt = req.Limit.Min
		limitMaxInt = req.Limit.Max
	}

	if limitMinInt < 1 {
		limitMinInt = 1
	}
	if limitMaxInt < limitMinInt {
		limitMaxInt = limitMinInt
	}

	offer := &models.Offer{
		IntermediaryWalletAddress: &intermediaryAddr,
		SellerWalletAddress:       walletAddr,
		SellerUserID:              sellerUserID,
		Side:                      req.Side,
		Symbol:                    req.Symbol,
		Amount:                    amountInt,
		TotalAmount:               amountInt,
		PayableAmount:             priceInt,
		Status:                    constants.TrandingOpen,
		BankInfo:                  bankInfoStr,
		Limit:                     &models.OfferLimit{Min: limitMinInt, Max: limitMaxInt},
	}

	var priceRateFloat *float64
	if req.PriceRate != nil && *req.PriceRate != "" {
		if r, parseErr := strconv.ParseFloat(*req.PriceRate, 64); parseErr == nil {
			priceRateFloat = &r
		}
	}
	// default to 1.0 if not provided
	if priceRateFloat == nil {
		def := 1.0
		priceRateFloat = &def
	}
	offer.PriceRate = priceRateFloat

	if priceRateFloat != nil {
		computed := float64(amountInt) * (*priceRateFloat)
		priceInt = int64(math.Round(computed))
	}
	offer.PayableAmount = priceInt

	if err = s.repo.CreateOffer(ctx, offer, tx); err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return offer, nil
}

func (s *OfferService) ListOffers(ctx context.Context, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error) {
	return s.repo.ListOffers(ctx, nil, nil, nil, nil, nil, fromAmount, toAmount, pagination)
}

func (s *OfferService) CountOffers(ctx context.Context, walletAddress *string, fromAmount *string, toAmount *string) (int64, error) {
	return s.repo.CountOffers(ctx, walletAddress, fromAmount, toAmount)
}

func (s *OfferService) GetOfferByID(ctx context.Context, id int64) (*models.Offer, error) {
	return s.repo.GetOfferByID(ctx, id)
}

func (s *OfferService) GetOffersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any, fromAmount *string, toAmount *string) ([]models.Offer, int64, error) {
	offers, err := s.repo.GetOffersByWalletAddress(ctx, walletAddress, pagination, fromAmount, toAmount)
	if err != nil {
		return nil, 0, err
	}
	count, err := s.repo.CountOffers(ctx, &walletAddress, fromAmount, toAmount)
	if err != nil {
		return nil, 0, err
	}
	return offers, count, nil
}

func (s *OfferService) UpdateOfferStatus(ctx context.Context, req *models.UpdateOfferStatusRequest) error {
	offer, err := s.repo.GetOfferByID(ctx, req.OfferID)
	if err != nil {
		return fmt.Errorf("failed to get offer: %w", err)
	}

	// Verify transaction exists in blockchain
	if s.blockchain != nil && req.Status == constants.TradingConfirmed {
		if offer.Status != constants.TrandingOpen {
			return fmt.Errorf("offer status invalid for confirmation: %s", offer.Status)
		}
		txInfo, err := s.blockchain.GetTransaction(req.TxHash)
		if err != nil {
			return fmt.Errorf("failed to verify transaction: %w", err)
		}
		if txInfo == nil {
			return fmt.Errorf("transaction not found in blockchain")
		}

		if txInfo.Status != constants.TxStatusConfirmed && txInfo.Status != constants.TxStatusFinalized {
			return fmt.Errorf("transaction not confirmed: status=%d", txInfo.Status)
		}

		if txInfo.Sender != offer.SellerWalletAddress {
			return fmt.Errorf("transaction sender mismatch: expected %s, got %s", offer.SellerWalletAddress, txInfo.Sender)
		}

		if offer.IntermediaryWalletAddress != nil && txInfo.Recipient != *offer.IntermediaryWalletAddress {
			return fmt.Errorf("transaction recipient mismatch: expected %s, got %s", *offer.IntermediaryWalletAddress, txInfo.Recipient)
		}

		actualAmount := int64(txInfo.Amount.Uint64() / 1000000)
		if actualAmount != offer.Amount {
			return fmt.Errorf("transaction amount mismatch: expected %d, got %d", offer.Amount, actualAmount)
		}
	}

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err = s.repo.UpdateOfferStatus(ctx, req.OfferID, req.Status, tx, &req.TxHash); err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	if req.Status == constants.TradingFailed {
		offer, err := s.repo.GetOfferByID(ctx, req.OfferID)
		if err == nil && offer != nil && offer.IntermediaryWalletAddress != nil && *offer.IntermediaryWalletAddress != "" {
			w, wErr := s.walletRepo.GetWalletByAddress(ctx, *offer.IntermediaryWalletAddress)
			if wErr == nil && w != nil {
				if upErr := s.walletRepo.UpdateWalletStatus(ctx, w.ID, constants.RedEnvelopeWalletStatusReady); upErr != nil {
				}
			}
		}
	}

	return nil
}
