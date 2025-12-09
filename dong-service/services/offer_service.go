package services

import (
	"context"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/models"
	"dong-service/repository"
	"encoding/json"
	"fmt"
	"math"
	"strconv"
)

type OfferService struct {
	repo       *repository.OfferRepository
	walletRepo *repository.IntermediaryWalletRepository
	orderRepo  *repository.OrderRepository
	blockchain *blockchain.BlockchainService
}

func NewOfferService(repo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository, orderRepo *repository.OrderRepository, blockchain *blockchain.BlockchainService) *OfferService {
	return &OfferService{repo: repo, walletRepo: walletRepo, orderRepo: orderRepo, blockchain: blockchain}
}

type IOfferService interface {
	CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string) (*models.Offer, error)
	ConfirmOffer(ctx context.Context, offerID int64, executionPrice *string, source *string, metadata *string) error
	ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error)
	CountOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, fromAmount *string, toAmount *string) (int64, error)
	GetOfferByID(ctx context.Context, id int64) (*models.Offer, error)
	GetIntermediaryWalletAddress(ctx context.Context, walletID int64) (string, error)
}

func (s *OfferService) CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string) (*models.Offer, error) {
	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	var walletID int64
	var intermediaryAddr string
	if req.IntermediaryWalletID != nil {
		walletID = *req.IntermediaryWalletID
	} else {
		wallet, err := s.walletRepo.GetOrCreateAvailableWallet(ctx, tx, constants.WalletTypeOffer)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("failed to get or create intermediary wallet: %w", err)
		}
		walletID = wallet.ID
		intermediaryAddr = wallet.WalletAddress

		if err := s.walletRepo.UpdateIntermediaryWalletStatus(tx, ctx, walletID, constants.WalletTypeOffer); err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("failed to update intermediary wallet: %w", err)
		}
	}

	var priceInt int64 = 0

	quantityInt, err := strconv.ParseInt(req.Quantity, 10, 64)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	var metadataStr *string
	if req.Metadata != nil {
		b, err := json.Marshal(req.Metadata)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("invalid metadata: %w", err)
		}
		ms := string(b)
		metadataStr = &ms
	}

	var limitMinInt int64 = 1
	var limitMaxInt int64 = quantityInt
	if req.Limit != nil {
		if req.Limit.Min != nil && *req.Limit.Min != "" {
			v, err := strconv.ParseInt(*req.Limit.Min, 10, 64)
			if err != nil {
				_ = tx.Rollback()
				return nil, fmt.Errorf("invalid limit_min: %w", err)
			}
			limitMinInt = v
		}
		if req.Limit.Max != nil && *req.Limit.Max != "" {
			v, err := strconv.ParseInt(*req.Limit.Max, 10, 64)
			if err != nil {
				_ = tx.Rollback()
				return nil, fmt.Errorf("invalid limit_max: %w", err)
			}
			limitMaxInt = v
		}
	}

	if limitMinInt < 1 {
		limitMinInt = 1
	}
	if limitMaxInt < limitMinInt {
		limitMaxInt = limitMinInt
	}

	offer := &models.Offer{
		IntermediaryWalletID: walletID,
		WalletAddress:        intermediaryAddr,
		Side:                 req.Side,
		Symbol:               req.Symbol,
		Quantity:             quantityInt,
		TotalQuantity:        quantityInt,
		Price:                priceInt,
		PriceType:            constants.PriceTypeFixed,
		Status:               string(constants.TradingPending),
		Metadata:             metadataStr,
		Limit:                &models.OfferLimit{Min: limitMinInt, Max: limitMaxInt},
	}

	if req.PriceType != nil && *req.PriceType != "" {
		offer.PriceType = *req.PriceType
	}

	var priceRateStr *string
	if req.PriceRate != nil && *req.PriceRate != "" {
		priceRateStr = req.PriceRate
	}
	if priceRateStr == nil {
		v := "1"
		priceRateStr = &v
	}
	offer.PriceRate = priceRateStr

	if priceRateStr != nil {
		if rate, err := strconv.ParseFloat(*priceRateStr, 64); err == nil {
			computed := float64(quantityInt) * rate
			priceInt = int64(math.Round(computed))
		}
	}
	offer.Price = priceInt

	if err := s.repo.CreateOffer(ctx, offer, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if intermediaryAddr != "" {
		offer.WalletAddress = intermediaryAddr
	}

	return offer, nil
}

func (s *OfferService) ConfirmOffer(ctx context.Context, offerID int64, executionPrice *string, source *string, metadata *string) error {
	db := database.GetDB()
	pendingOrder, _ := s.orderRepo.GetPendingOrderForOffer(ctx, offerID)

	var txHash *string

	if pendingOrder != nil && pendingOrder.WalletAddress != nil && s.blockchain != nil {

		w, err := s.walletRepo.GetWalletByID(ctx, pendingOrder.IntermediaryWalletID)
		if err == nil {

			if pendingOrder.Amount > 0 {
				txh, err := s.blockchain.TransferMoney(w.EncryptedPrivateKey, w.WalletAddress, *pendingOrder.WalletAddress, pendingOrder.Amount)
				if err != nil {
					return fmt.Errorf("failed to transfer funds during offer confirm: %w", err)
				}
				txHash = &txh
			}
		}
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := s.repo.UpdateOfferStatus(ctx, offerID, string(constants.TradingConfirmed), tx, txHash); err != nil {
		_ = tx.Rollback()
		return err
	}

	if pendingOrder != nil {
		if err := s.orderRepo.UpdateOrderStatus(ctx, pendingOrder.OrderID, string(models.OrderStatusConfirmed), tx); err != nil {
			_ = tx.Rollback()
			return err
		}

		if err := s.repo.ApplyConfirmedQuantity(ctx, offerID, pendingOrder.Quantity, tx); err != nil {
			_ = tx.Rollback()
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return err
	}

	return nil
}

func (s *OfferService) ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error) {
	return s.repo.ListOffers(ctx, minPrice, maxPrice, status, symbol, rate, fromAmount, toAmount, pagination)
}

func (s *OfferService) CountOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, fromAmount *string, toAmount *string) (int64, error) {
	return s.repo.CountOffers(ctx, minPrice, maxPrice, status, symbol, rate, fromAmount, toAmount)
}

func (s *OfferService) GetOfferByID(ctx context.Context, id int64) (*models.Offer, error) {
	return s.repo.GetOfferByID(ctx, id)
}

func (s *OfferService) GetIntermediaryWalletAddress(ctx context.Context, walletID int64) (string, error) {
	w, err := s.walletRepo.GetWalletByID(ctx, walletID)
	if err != nil {
		return "", err
	}
	return w.WalletAddress, nil
}
