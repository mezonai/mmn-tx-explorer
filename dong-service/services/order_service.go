package services

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"fmt"
)

type OrderService struct {
	repo       *repository.OrderRepository
	walletRepo *repository.IntermediaryWalletRepository
}

func NewOrderService(repo *repository.OrderRepository, walletRepo *repository.IntermediaryWalletRepository) *OrderService {
	return &OrderService{repo: repo, walletRepo: walletRepo}
}

// IOrderService defines the subset of methods used by handlers (for easier testing).
type IOrderService interface {
	CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error)
}

// CreateOrder performs validation, persists the order and creates an initial history row atomically.
func (s *OrderService) CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error) {
	// Basic validation
	if req.Side != models.OrderSideBuy && req.Side != models.OrderSideSell {
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

	// Determine intermediary wallet id
	var walletID int64
	if req.IntermediaryWalletID != nil {
		walletID = *req.IntermediaryWalletID
	} else {
		// Acquire or create an available wallet in the pool
		wallet, err := s.walletRepo.GetOrCreateAvailableWallet(ctx, tx)
		if err != nil {
			_ = tx.Rollback()
			logger.Error().Err(err).Msg("failed to get or create intermediary wallet for order")
			return nil, err
		}
		walletID = wallet.ID
	}

	// Prepare order
	priceType := constants.PriceTypeFixed
	if req.PriceType != nil && *req.PriceType != "" {
		priceType = *req.PriceType
	}

	var metadataStr *string
	if req.Metadata != nil {
		// Lazily encode metadata as JSON string to persist; repository inserts raw string into JSONB column
		// Avoid importing encoding/json in service to keep it simple - repository expects string JSON when present
		// Use fmt.Sprintf as a best-effort to stringify
		ms := fmt.Sprintf("%v", req.Metadata)
		metadataStr = &ms
	}

	order := &models.Order{
		IntermediaryWalletID: walletID,
		UserID:               req.UserID,
		Side:                 req.Side,
		Symbol:               req.Symbol,
		Quantity:             req.Quantity,
		Price:                "0",
		FilledQuantity:       "0",
		PriceType:            priceType,
		PriceReference:       req.PriceReference,
		Spread:               req.Spread,
		Status:               constants.OrderStatusPending,
		ExternalRef:          req.ExternalRef,
		Metadata:             metadataStr,
		ExpiresAt:            req.ExpiresAt,
	}

	if req.Price != nil {
		order.Price = *req.Price
	}

	// Persist order
	if err := s.repo.CreateOrder(ctx, order, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Create initial history record (CREATED_PENDING)
	history := &models.OrderHistory{
		OrderID:   order.OrderID,
		EventType: constants.OrderEventCreatedPending,
		Quantity:  order.Quantity,
		Metadata:  order.Metadata,
	}

	if err := s.repo.CreateOrderHistory(ctx, history, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	return order, nil
}
