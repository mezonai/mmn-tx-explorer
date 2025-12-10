package services

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/models"
	"dong-service/repository"

	"fmt"
	"strconv"
	"time"
)

type OrderService struct {
	repo      *repository.OrderRepository
	offerRepo *repository.OfferRepository
}

func NewOrderService(repo *repository.OrderRepository, offerRepo *repository.OfferRepository) *OrderService {
	return &OrderService{repo: repo, offerRepo: offerRepo}
}

type IOrderService interface {
	CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, error)
	ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error)
	GetOrderByID(ctx context.Context, id int64) (*models.Order, error)
	ConfirmOrder(ctx context.Context, orderID int64, executionPrice *string, source *string, metadata *string) error
	GetOrdersByWalletAddress(ctx context.Context, walletAddress string) ([]models.Order, error)
}

func (s *OrderService) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, error) {
	offer, err := s.offerRepo.GetOfferByID(ctx, offerID)
	if err != nil {
		return nil, fmt.Errorf("offer not found: %w", err)
	}

	if req.Amount == "" {
		return nil, fmt.Errorf("amount required")
	}

	if offer.Status != string(constants.TradingPending) && offer.Status != string(constants.TrandingOpen) {
		return nil, fmt.Errorf("offer not ready for orders: status=%s", offer.Status)
	}

	if has, err := s.repo.HasActiveOrders(ctx, offerID); err != nil {
		return nil, fmt.Errorf("failed to check active orders: %w", err)
	} else if has {
		return nil, fmt.Errorf("offer currently has active order(s); cannot create another order")
	}

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	var priceInt int64
	if req.Price != nil {
		var err error
		priceInt, err = strconv.ParseInt(*req.Price, 10, 64)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("invalid price: %v", err)
		} else {
			priceInt = offer.Price
		}
	}

	amountInt, err := strconv.ParseInt(req.Amount, 10, 64)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("invalid amount: %v", err)
	}

	var walletAddrPtr *string
	if walletAddress != "" {
		a := walletAddress
		walletAddrPtr = &a
	}

	// Generate transfer_code: SYMBOL + " " + OFFER_ID
	var transferCode string
	if offer.Symbol != "" {
		transferCode = fmt.Sprintf("%s %d", offer.Symbol, offerID)
	} else {
		transferCode = fmt.Sprintf("ORDER %d", offerID)
	}

	order := &models.Order{
		OfferID:            &offerID,
		BuyerWalletAddress: walletAddrPtr,
		Amount:             amountInt,
		Price:              priceInt,
		Status:             string(constants.TradingPending),
		TransferCode:       &transferCode,
		ExpiresAt:          nil,
	}

	if err := s.offerRepo.ReserveQuantity(ctx, offerID, amountInt, tx); err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("failed to reserve offer quantity: %w", err)
	}

	if err := s.repo.CreateOrder(ctx, order, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	return order, nil
}

func (s *OrderService) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error) {
	return s.repo.ListOrdersByOffer(ctx, offerID, pagination)
}

func (s *OrderService) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	o, err := s.repo.GetOrderByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return o, nil
}

func (s *OrderService) GetOrdersByWalletAddress(ctx context.Context, walletAddress string) ([]models.Order, error) {
	return s.repo.GetOrdersByWalletAddress(ctx, walletAddress)
}

func (s *OrderService) ConfirmOrder(ctx context.Context, orderID int64, executionPrice *string, source *string, metadata *string) error {
	// load order
	o, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to fetch order: %w", err)
	}

	if o.Status != string(models.OrderStatusPending) {
		return fmt.Errorf("order not pending")
	}

	// check expiry: prefer explicit ExpiresAt if set, otherwise use created_at + 15m
	now := time.Now().UTC()
	var expired bool
	if o.ExpiresAt != nil {
		expired = now.After(o.ExpiresAt.UTC())
	} else {
		expired = now.Sub(o.CreatedAt) > 15*time.Minute
	}

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if expired {
		if err := s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusCanceled), tx); err != nil {
			_ = tx.Rollback()
			return err
		}

		if o.OfferID != nil {
			if err := s.offerRepo.ReleaseQuantity(ctx, *o.OfferID, o.Amount, tx); err != nil {
				_ = tx.Rollback()
				return err
			}
		}

		if err := tx.Commit(); err != nil {
			_ = tx.Rollback()
			return err
		}

		return fmt.Errorf("order expired and was cancelled")
	}

	// not expired - confirm
	if err := s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusConfirmed), tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if o.OfferID != nil {
		if err := s.offerRepo.ApplyConfirmedQuantity(ctx, *o.OfferID, o.Amount, tx); err != nil {
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
