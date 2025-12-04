package services

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"fmt"
	"strconv"
)

type OfferService struct {
	repo       *repository.OfferRepository
	walletRepo *repository.IntermediaryWalletRepository
}

func NewOfferService(repo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository) *OfferService {
	return &OfferService{repo: repo, walletRepo: walletRepo}
}

// IOfferService defines the subset of methods used by handlers (for easier testing).
type IOfferService interface {
	CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddress string) (*models.Offer, error)
	ConfirmOffer(ctx context.Context, offerID int64, executionPrice *string, source *string, metadata *string) error
	ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, pagination map[string]any) ([]models.Offer, error)
	GetOfferByID(ctx context.Context, offerID int64) (*models.Offer, error)
}

// CreateOffer performs validation, persists the offer and creates an initial history row atomically.
func (s *OfferService) CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddress string) (*models.Offer, error) {
	// Basic validation
	if req.Side != models.OfferSideBuy && req.Side != models.OfferSideSell {
		return nil, fmt.Errorf("invalid side: %s", req.Side)
	}
	if req.Symbol == "" {
		return nil, fmt.Errorf("symbol is required")
	}
	if req.Quantity == "" {
		return nil, fmt.Errorf("quantity is required")
	}

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	var walletID int64
	if req.IntermediaryWalletID != nil {
		walletID = *req.IntermediaryWalletID
	} else {
		wallet, err := s.walletRepo.GetOrCreateAvailableWallet(ctx, tx)
		if err != nil {
			_ = tx.Rollback()
			logger.Error().Err(err).Msg("failed to get or create intermediary wallet for offer")
			return nil, err
		}
		walletID = wallet.ID
	}

	priceType := constants.PriceTypeFixed
	if req.PriceType != nil && *req.PriceType != "" {
		priceType = *req.PriceType
	}

	var metadataStr *string
	if req.Metadata != nil {
		ms := fmt.Sprintf("%v", req.Metadata)
		metadataStr = &ms
	}

	var priceInt int64
	if req.Price != nil {
		var err error
		priceInt, err = strconv.ParseInt(*req.Price, 10, 64)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("invalid price: %v", err)
		}
	}

	quantityInt, err := strconv.ParseInt(req.Quantity, 10, 64)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("invalid quantity: %v", err)
	}

	offer := &models.Offer{
		IntermediaryWalletID: walletID,
		WalletAddress:        walletAddress,
		Side:                 req.Side,
		Symbol:               req.Symbol,
		Quantity:             quantityInt,
		TotalQuantity:        quantityInt,
		Price:                priceInt,
		PriceType:            priceType,
		Status:               constants.TradingPending,
		Metadata:             metadataStr,
	}

	if err := s.repo.CreateOffer(ctx, offer, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	history := &models.OfferHistory{
		OfferID:   offer.OfferID,
		EventType: constants.TradingPending,
		Quantity:  strconv.FormatInt(offer.Quantity, 10),
		Metadata:  offer.Metadata,
	}

	if err := s.repo.CreateOfferHistory(ctx, history, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	return offer, nil
}

// ConfirmOffer marks an offer as CONFIRMED and appends a CREATED_CONFIRMED history event.
func (s *OfferService) ConfirmOffer(ctx context.Context, offerID int64, executionPrice *string, source *string, metadata *string) error {
	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := s.repo.UpdateOfferStatus(ctx, offerID, constants.TradingConfirmed, tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	hist := &models.OfferHistory{
		OfferID:        offerID,
		EventType:      constants.TradingConfirmed,
		Quantity:       "0",
		ExecutionPrice: executionPrice,
		Source:         source,
		Metadata:       metadata,
	}

	if err := s.repo.CreateOfferHistory(ctx, hist, tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return err
	}

	return nil
}

// ListOffers returns offers using repository filtering helpers
func (s *OfferService) ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, pagination map[string]any) ([]models.Offer, error) {
	return s.repo.ListOffers(ctx, minPrice, maxPrice, status, symbol, pagination)
}

// GetOfferByID returns a single offer by id
func (s *OfferService) GetOfferByID(ctx context.Context, offerID int64) (*models.Offer, error) {
	return s.repo.GetOfferByID(ctx, offerID)
}
