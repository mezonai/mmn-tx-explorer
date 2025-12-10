package services

import (
	"context"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
)

type OrderService struct {
	repo       *repository.OrderRepository
	offerRepo  *repository.OfferRepository
	walletRepo *repository.IntermediaryWalletRepository
	blockchain *blockchain.BlockchainService
}

func NewOrderService(repo *repository.OrderRepository, offerRepo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository, blockchain *blockchain.BlockchainService) *OrderService {
	return &OrderService{repo: repo, offerRepo: offerRepo, walletRepo: walletRepo, blockchain: blockchain}
}

type IOrderService interface {
	CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, error)
	ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error)
	GetOrderByID(ctx context.Context, id int64) (*models.Order, error)
	ConfirmOrder(ctx context.Context, orderID int64, walletAddress string, executionPrice *string, source *string, metadata *string) error
	GetOrdersByWalletAddress(ctx context.Context, walletAddress string) ([]models.Order, error)
}

func (s *OrderService) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, error) {
	offer, err := s.offerRepo.GetOfferByID(ctx, offerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch offer: %w", err)
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

	var priceInt int64
	if req.Price != nil {
		var parseErr error
		priceInt, parseErr = strconv.ParseInt(*req.Price, 10, 64)
		if parseErr != nil {
			err = fmt.Errorf("invalid price: %v", parseErr)
			return nil, err
		}
	} else {
		priceInt = offer.Price
	}

	amountInt, parseErr := strconv.ParseInt(req.Amount, 10, 64)
	if parseErr != nil {
		err = fmt.Errorf("invalid amount: %v", parseErr)
		return nil, err
	}

	var walletAddrPtr *string
	if walletAddress != "" {
		walletAddrPtr = &walletAddress
	}

	transferCode := fmt.Sprintf("ORDER %d", offerID)

	expiresAt := time.Now().UTC().Add(15 * time.Minute)
	order := &models.Order{
		OfferID:            &offerID,
		BuyerWalletAddress: walletAddrPtr,
		Amount:             amountInt,
		Price:              priceInt,
		Status:             constants.TrandingOpen,
		TransferCode:       &transferCode,
		ExpiresAt:          &expiresAt,
	}

	if err = s.offerRepo.ReserveQuantity(ctx, offerID, amountInt, tx); err != nil {
		err = fmt.Errorf("failed to reserve offer quantity: %w", err)
		return nil, err
	}

	if err = s.repo.CreateOrder(ctx, order, tx); err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return order, nil
}

func (s *OrderService) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error) {
	return s.repo.ListOrdersByOffer(ctx, offerID, pagination)
}

func (s *OrderService) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	return s.repo.GetOrderByID(ctx, id)
}

func (s *OrderService) GetOrdersByWalletAddress(ctx context.Context, walletAddress string) ([]models.Order, error) {
	return s.repo.GetOrdersByWalletAddress(ctx, walletAddress)
}

func (s *OrderService) ConfirmOrder(ctx context.Context, orderID int64, walletAddress string, executionPrice *string, source *string, metadata *string) error {
	// load order
	o, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to fetch order: %w", err)
	}

	// Load offer to determine seller
	var offer *models.Offer
	if o.OfferID != nil {
		offer, err = s.offerRepo.GetOfferByID(ctx, *o.OfferID)
		if err != nil {
			return fmt.Errorf("failed to fetch offer: %w", err)
		}
	}

	// Check expiry
	now := time.Now().UTC()
	var expired bool
	if o.ExpiresAt != nil {
		expired = now.After(*o.ExpiresAt)
	}

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// Handle expired order
	if expired {
		if err = s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusCanceled), tx); err != nil {
			return err
		}

		if o.OfferID != nil {
			if err = s.offerRepo.ReleaseQuantity(ctx, *o.OfferID, o.Amount, tx); err != nil {
				return err
			}
		}

		if err = tx.Commit(); err != nil {
			return err
		}

		return fmt.Errorf("order expired and was cancelled")
	}

	// Determine if caller is seller or buyer
	isSeller := offer != nil && walletAddress == offer.SellerWalletAddress
	isBuyer := o.BuyerWalletAddress != nil && walletAddress == *o.BuyerWalletAddress

	if !isSeller && !isBuyer {
		return fmt.Errorf("caller is neither buyer nor seller")
	}

	if isBuyer {
		// Buyer confirm: OPEN -> PENDING
		if o.Status != string(models.OrderStatusOpen) {
			return fmt.Errorf("buyer can only confirm open orders; current status=%s", o.Status)
		}

		if err = s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusPending), tx); err != nil {
			return err
		}

		if err = tx.Commit(); err != nil {
			return err
		}

		// Send ORDER_CONFIRMED event to seller
		go func() {
			var receiveAddr string
			if o.OfferID != nil {
				of, err := s.offerRepo.GetOfferByID(context.Background(), *o.OfferID)
				if err == nil {
					receiveAddr = of.SellerWalletAddress
				}
			}

			if receiveAddr == "" {
				return
			}

			payload := map[string]any{
				"order_id": fmt.Sprint(o.OrderID),
				"amount":   o.Amount,
			}
			p, _ := json.Marshal(payload)

			event := &models.Event{
				ID:             uuid.New(),
				Type:           "ORDER_CONFIRMED",
				Payload:        p,
				ReceiveAddress: receiveAddr,
				Status:         "pending",
				CreateAt:       time.Now().UTC(),
			}

			if Event == nil {
				return
			}

			if err := Event.SendEvent(event); err != nil {
				logger.Error().Err(err).Msg("failed to send ORDER_CONFIRMED event")
			}
		}()

		return nil
	}

	if isSeller {
		// Seller confirm: PENDING -> CONFIRMED + transfer funds + deduct offer amount
		if o.Status != string(models.OrderStatusPending) {
			return fmt.Errorf("seller can only confirm pending orders; current status=%s", o.Status)
		}

		if err = s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusConfirmed), tx); err != nil {
			return err
		}

		// Deduct from offer amount
		if o.OfferID != nil {
			if err = s.offerRepo.ApplyConfirmedQuantity(ctx, *o.OfferID, o.Amount, tx); err != nil {
				return err
			}
		}

		if err = tx.Commit(); err != nil {
			return err
		}

		// Transfer funds from intermediary wallet to buyer wallet
		if offer != nil && offer.IntermediaryWalletAddress != nil && *offer.IntermediaryWalletAddress != "" && o.BuyerWalletAddress != nil && s.blockchain != nil {
			intermediaryWallet, walletErr := s.walletRepo.GetWalletByAddress(ctx, *offer.IntermediaryWalletAddress)
			if walletErr != nil {
				return fmt.Errorf("failed to fetch intermediary wallet: %w", walletErr)
			}

			if intermediaryWallet != nil && o.Amount > 0 {
				_, transferErr := s.blockchain.TransferMoney(intermediaryWallet.EncryptedPrivateKey, *offer.IntermediaryWalletAddress, *o.BuyerWalletAddress, o.Amount)
				if transferErr != nil {
					return fmt.Errorf("failed to transfer funds to buyer: %w", transferErr)
				}
			}
		}

		return nil
	}

	return fmt.Errorf("unable to determine caller role")
}
