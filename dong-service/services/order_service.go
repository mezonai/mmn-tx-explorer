package services

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/models"
	"dong-service/repository"

	"encoding/json"
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
}

func (s *OrderService) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, error) {
	// Validate offer exists
	offer, err := s.offerRepo.GetOfferByID(ctx, offerID)
	if err != nil {
		return nil, fmt.Errorf("offer not found: %w", err)
	}

	// Basic validation - request-side fields were removed; rely on the offer's side
	if req.Quantity == "" {
		return nil, fmt.Errorf("quantity required")
	}

	// Symbol/Side are not supplied on orders anymore — any necessary details should
	// be derived from the offer returned above.

	// Offer must be in a pending/open state
	if offer.Status != string(constants.TradingPending) && offer.Status != string(constants.TrandingOpen) {
		return nil, fmt.Errorf("offer not ready for orders: status=%s", offer.Status)
	}

	// Prevent new orders when the offer already has active orders (PENDING/CONFIRMED)
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

	// Orders do not require intermediary wallets — orders will not reserve/allocate intermediary wallets

	var priceInt int64
	if req.Price != nil {
		var err error
		priceInt, err = strconv.ParseInt(*req.Price, 10, 64)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("invalid price: %v", err)
		} else {
			// When no explicit price supplied, use the offer's price so orders use offer price
			priceInt = offer.Price
		}
	}

	quantityInt, err := strconv.ParseInt(req.Quantity, 10, 64)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("invalid quantity: %v", err)
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

	// Compute amount: if request includes amount, use it. Otherwise compute quantity * price if price present.
	var amountInt int64
	if req.Amount != nil && *req.Amount != "" {
		amountInt, err = strconv.ParseInt(*req.Amount, 10, 64)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("invalid amount: %v", err)
		}
	} else if priceInt != 0 {
		amountInt = quantityInt * priceInt
	} else {
		amountInt = 0
	}

	// WalletAddress is provided separately (derived from authenticated user / caller)
	var walletAddrPtr *string
	if walletAddress != "" {
		a := walletAddress
		walletAddrPtr = &a
	}

	order := &models.Order{
		IntermediaryWalletID: offer.IntermediaryWalletID,
		Side:                 string(offer.Side),
		Symbol:               offer.Symbol,
		OfferID:              &offerID,
		WalletAddress:        walletAddrPtr,
		Quantity:             quantityInt,
		Amount:               amountInt,
		Price:                priceInt,
		Status:               string(constants.TradingPending),
		ExternalRef:          req.ExternalRef,
		Metadata:             metadataStr,
		ExpiresAt:            req.ExpiresAt,
	}

	// Reserve the quantity on the offer (block it while order is pending)
	if err := s.offerRepo.ReserveQuantity(ctx, offerID, quantityInt, tx); err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("failed to reserve offer quantity: %w", err)
	}

	if err := s.repo.CreateOrder(ctx, order, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// order_history table may not exist in some deployments — skip writing a history row here

	// no intermediary wallet bookkeeping for orders

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

	// If the order references an offer, fetch the offer's metadata and attach it
	// to the returned order so API consumers can see offer-level metadata inline.
	if o.OfferID != nil {
		if offer, err := s.offerRepo.GetOfferByID(ctx, *o.OfferID); err == nil {
			o.OfferMetadata = offer.Metadata
		}
	}

	return o, nil
}

// ConfirmOrder confirms a pending order if it is still within the allowed confirmation window.
// If the order has expired it will be cancelled and an error returned.
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
		// mark canceled and write history
		if err := s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusCanceled), tx); err != nil {
			_ = tx.Rollback()
			return err
		}

		// release reserved quantity back to offer
		if o.OfferID != nil {
			if err := s.offerRepo.ReleaseQuantity(ctx, *o.OfferID, o.Quantity, tx); err != nil {
				_ = tx.Rollback()
				return err
			}
		}

		// history writing disabled for cancelled orders (order_history table removed)

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

	// order history writing disabled for confirmation step (order_history table removed)

	// apply confirmed quantity to offer (finalize consumption)
	if o.OfferID != nil {
		if err := s.offerRepo.ApplyConfirmedQuantity(ctx, *o.OfferID, o.Quantity, tx); err != nil {
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
