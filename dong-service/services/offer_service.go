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
	ListOffers(ctx context.Context, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error)
	CountOffers(ctx context.Context, fromAmount *string, toAmount *string) (int64, error)
	GetOfferByID(ctx context.Context, id int64) (*models.Offer, error)
	GetOffersByWalletAddress(ctx context.Context, walletAddress string) ([]models.Offer, error)
}

func (s *OfferService) CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string) (*models.Offer, error) {
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

	amountInt, parseErr := strconv.ParseInt(req.Amount, 10, 64)
	if parseErr != nil {
		err = fmt.Errorf("invalid amount: %w", parseErr)
		return nil, err
	}

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
		if req.Limit.Min != nil && *req.Limit.Min != "" {
			v, parseErr := strconv.ParseInt(*req.Limit.Min, 10, 64)
			if parseErr != nil {
				err = fmt.Errorf("invalid limit_min: %w", parseErr)
				return nil, err
			}
			limitMinInt = v
		}
		if req.Limit.Max != nil && *req.Limit.Max != "" {
			v, parseErr := strconv.ParseInt(*req.Limit.Max, 10, 64)
			if parseErr != nil {
				err = fmt.Errorf("invalid limit_max: %w", parseErr)
				return nil, err
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
		IntermediaryWalletAddress: &intermediaryAddr,
		SellerWalletAddress:       walletAddr,
		Side:                      req.Side,
		Symbol:                    req.Symbol,
		Amount:                    amountInt,
		TotalAmount:               amountInt,
		Price:                     priceInt,
		PriceType:                 constants.PriceTypeFixed,
		Status:                    constants.TradingPending,
		BankInfo:                  bankInfoStr,
		Limit:                     &models.OfferLimit{Min: limitMinInt, Max: limitMaxInt},
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
		if rate, parseErr := strconv.ParseFloat(*priceRateStr, 64); parseErr == nil {
			computed := float64(amountInt) * rate
			priceInt = int64(math.Round(computed))
		}
	}
	offer.Price = priceInt

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

func (s *OfferService) CountOffers(ctx context.Context, fromAmount *string, toAmount *string) (int64, error) {
	return s.repo.CountOffers(ctx, nil, nil, nil, nil, nil, fromAmount, toAmount)
}

func (s *OfferService) GetOfferByID(ctx context.Context, id int64) (*models.Offer, error) {
	return s.repo.GetOfferByID(ctx, id)
}

func (s *OfferService) GetOffersByWalletAddress(ctx context.Context, walletAddress string) ([]models.Offer, error) {
	return s.repo.GetOffersByWalletAddress(ctx, walletAddress)
}
