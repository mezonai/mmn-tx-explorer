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
	"time"

	"github.com/google/uuid"
)

type OrderService struct {
	repo         *repository.OrderRepository
	offerRepo    *repository.OfferRepository
	walletRepo   *repository.IntermediaryWalletRepository
	blockchain   *blockchain.BlockchainService
	offerService *OfferService
}

func NewOrderService(repo *repository.OrderRepository, offerRepo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository, blockchain *blockchain.BlockchainService, offerService *OfferService) *OrderService {
	return &OrderService{repo: repo, offerRepo: offerRepo, walletRepo: walletRepo, blockchain: blockchain, offerService: offerService}
}

type IOrderService interface {
	CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, *models.Offer, error)
	ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error)
	GetOrderByID(ctx context.Context, id int64) (*models.Order, error)
	ConfirmOrderAsBuyer(ctx context.Context, orderID int64, o *models.Order) error
	ConfirmOrderAsSeller(ctx context.Context, orderID int64, o *models.Order, offer *models.Offer) error
	GetOrdersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Order, int64, error)
}

func (s *OrderService) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, *models.Offer, error) {
	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	offer, err := s.offerRepo.GetOfferByIDForUpdate(ctx, offerID, tx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch offer: %w", err)
	}

	hasActive, err := s.repo.HasActiveOrders(ctx, offerID, tx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to check active orders: %w", err)
	}
	if hasActive {
		return nil, nil, fmt.Errorf("offer already has active pending orders")
	}

	payableAmount := offer.PayableAmount
	if req.PayableAmount != nil {
		payableAmount = *req.PayableAmount
	}
	amount := req.Amount

	if offer.Limit != nil {
		if amount < offer.Limit.Min {
			return nil, nil, fmt.Errorf("order amount %d is below minimum limit %d", amount, offer.Limit.Min)
		}
		if amount > offer.Limit.Max {
			return nil, nil, fmt.Errorf("order amount %d exceeds maximum limit %d", amount, offer.Limit.Max)
		}
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
		Amount:             amount,
		PayableAmount:      payableAmount,
		Status:             constants.TrandingOpen,
		TransferCode:       &transferCode,
		ExpiresAt:          &expiresAt,
	}

	if err = s.offerRepo.ReserveQuantity(ctx, offerID, amount, tx); err != nil {
		err = fmt.Errorf("failed to reserve offer quantity: %w", err)
		return nil, nil, err
	}

	if err = s.repo.CreateOrder(ctx, order, tx); err != nil {
		return nil, nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, nil, err
	}

	order.BankInfo = offer.BankInfo
	order.SellerWalletAddress = &offer.SellerWalletAddress

	return order, offer, nil
}

func (s *OrderService) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error) {
	orders, err := s.repo.ListOrdersByOffer(ctx, offerID, pagination)
	if err != nil {
		return nil, err
	}

	of, err := s.offerRepo.GetOfferByID(ctx, offerID)
	if err == nil && of != nil {
		for i := range orders {
			orders[i].BankInfo = of.BankInfo
		}
	}

	return orders, nil
}

func (s *OrderService) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	o, err := s.repo.GetOrderByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if o != nil && o.OfferID != nil {
		of, err := s.offerRepo.GetOfferByID(ctx, *o.OfferID)
		if err == nil && of != nil {
			o.BankInfo = of.BankInfo
		}
	}

	return o, nil
}

func (s *OrderService) GetOrdersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Order, int64, error) {
	orders, err := s.repo.GetOrdersByWalletAddress(ctx, walletAddress, pagination)
	if err != nil {
		return nil, 0, err
	}
	count, err := s.repo.CountOrdersByWalletAddress(ctx, walletAddress)
	if err != nil {
		return nil, 0, err
	}

	for i := range orders {
		if orders[i].OfferID != nil {
			of, err := s.offerRepo.GetOfferByID(ctx, *orders[i].OfferID)
			if err == nil && of != nil {
				orders[i].BankInfo = of.BankInfo
				orders[i].SellerWalletAddress = &of.SellerWalletAddress
			}
		}
	}

	return orders, count, nil
}

func (s *OrderService) ConfirmOrderAsBuyer(ctx context.Context, orderID int64, o *models.Order) error {
	// Buyer confirm: OPEN -> PENDING
	if o.Status != string(models.OrderStatusOpen) {
		return fmt.Errorf("buyer can only confirm open orders; current status=%s", o.Status)
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

	if err = s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusPending), tx); err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	// Send ORDER_CONFIRMED event to seller
	if o.OfferID != nil {
		of, err := s.offerRepo.GetOfferByID(context.Background(), *o.OfferID)
		if err == nil && of.SellerWalletAddress != "" {
			payload := map[string]any{"order_id": fmt.Sprint(o.OrderID), "amount": o.Amount}
			go s.sendOrderEvent(of.SellerWalletAddress, "ORDER_CONFIRMED", payload)
		}
	}

	return nil
}

func (s *OrderService) ConfirmOrderAsSeller(ctx context.Context, orderID int64, o *models.Order, offer *models.Offer) error {
	// Seller confirm: PENDING -> CONFIRMED + transfer funds + deduct offer amount
	if o.Status != string(models.OrderStatusPending) {
		return fmt.Errorf("seller can only confirm pending orders; current status=%s", o.Status)
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

	// Transfer funds from intermediary wallet to buyer wallet BEFORE updating database
	var transferTxHash *string
	if offer != nil && offer.IntermediaryWalletAddress != nil && *offer.IntermediaryWalletAddress != "" && o.BuyerWalletAddress != nil && s.blockchain != nil {
		intermediaryWallet, walletErr := s.walletRepo.GetWalletByAddress(ctx, *offer.IntermediaryWalletAddress)
		if walletErr != nil {
			err = fmt.Errorf("failed to fetch intermediary wallet: %w", walletErr)
			return err
		}

		if err = s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusConfirmed), tx); err != nil {
			return err
		}

		if intermediaryWallet != nil && o.Amount > 0 {
			txHash, transferErr := s.blockchain.TransferMoney(intermediaryWallet.EncryptedPrivateKey, *offer.IntermediaryWalletAddress, *o.BuyerWalletAddress, o.Amount)
			if transferErr != nil {
				err = fmt.Errorf("failed to transfer funds to buyer: %w", transferErr)
				return err
			}

			transferTxHash = &txHash

			// Check transaction status with retry logic
			status, statusErr := s.blockchain.CheckTransactionStatus(txHash)

			// Status 2 = COMPLETED
			if statusErr == nil && status == constants.TxStatusFinalized {
				logger.Info().
					Str("tx_hash", txHash).
					Msg("Transaction completed successfully")
				if err = s.repo.UpdateOrderStatusWithTxHash(ctx, orderID, string(models.OrderStatusCompleted), transferTxHash, tx); err != nil {
					return err
				}

				if o.OfferID != nil {
					if err = s.offerRepo.ApplyConfirmedQuantity(ctx, *o.OfferID, o.Amount, tx); err != nil {
						return err
					}
					if s.offerService != nil {
						s.offerService.ReleaseIntermediaryWalletIfOfferComplete(ctx, *o.OfferID, tx)
					}
				}

				if o.BuyerWalletAddress != nil && *o.BuyerWalletAddress != "" {
					payload := map[string]any{"order_id": fmt.Sprint(o.OrderID), "amount": o.Amount, "tx_hash": txHash}
					go s.sendOrderEvent(*o.BuyerWalletAddress, "ORDER_COMPLETED", payload)
				}
			} else if status == constants.TxStatusPending || status == constants.TxStatusConfirmed || status == constants.TxStatusFailed {
				// Status 0, 1, 3 = PENDING, CONFIRMED, FAILED
				if o.OfferID != nil {
					if releaseErr := s.offerRepo.ReleaseQuantity(ctx, *o.OfferID, o.Amount, tx); releaseErr != nil {
						logger.Error().Err(releaseErr).Int64("offer_id", *o.OfferID).Int64("amount", o.Amount).Msg("Failed to release quantity after transaction failure")
					} else {
						logger.Info().Int64("offer_id", *o.OfferID).Int64("amount", o.Amount).Msg("Released quantity back to offer after transaction failure")
					}
				}
				if err = s.repo.UpdateOrderStatusWithTxHash(ctx, orderID, string(models.OrderStatusFailed), transferTxHash, tx); err != nil {
					return err
				}
				err = fmt.Errorf("transaction failed with status %d", status)
				return err
			}
		}
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (s *OrderService) sendOrderEvent(receiveAddr string, eventType string, payload map[string]any) {
	if receiveAddr == "" {
		return
	}
	p, _ := json.Marshal(payload)

	event := &models.Event{
		ID:             uuid.New(),
		Type:           eventType,
		Payload:        p,
		ReceiveAddress: receiveAddr,
		Status:         "pending",
		CreateAt:       time.Now().UTC(),
	}

	if Event == nil {
		return
	}

	if err := Event.SendEvent(event); err != nil {
		logger.Error().Err(err).Msgf("failed to send %s event", eventType)
	}
}
