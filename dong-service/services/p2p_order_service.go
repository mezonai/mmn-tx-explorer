package services

import (
	"context"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/types"
	"fmt"
	"math"
	"time"
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
	CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string, buyerUserID string) (*models.Order, *models.Offer, error)
	ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, int64, error)
	GetOrderByID(ctx context.Context, id int64) (*models.Order, error)
	ConfirmOrderAsBuyer(ctx context.Context, orderID int64, o *models.Order) error
	ConfirmOrderAsSeller(ctx context.Context, orderID int64, o *models.Order, offer *models.Offer) error
	GetOrdersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Order, int64, error)
}

func (s *OrderService) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string, buyerUserID string) (*models.Order, *models.Offer, error) {
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

	// Check if user has reached the limit of 10 active orders
	activeOrderCount, err := s.repo.CountActiveOrdersByUser(ctx, buyerUserID, tx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to check user active orders: %w", err)
	}
	if activeOrderCount >= constants.MaxActiveOrdersPerUser {
		return nil, nil, constants.ErrUserOrderLimitExceeded
	}

	orderAmount := types.NewBigIntString(req.Amount).Multiply(constants.TokenMultiplierBigIntString)
	var payableAmount types.BigIntString
	if offer.PriceRate != nil {
		computed := float64(req.Amount) * (*offer.PriceRate)
		payableAmount.SetInt64(int64(math.Round(computed)))
	} else {
		payableAmount.SetInt64(req.Amount)
	}

	var walletAddrPtr *string
	if walletAddress != "" {
		walletAddrPtr = &walletAddress
	}

	transferCode := fmt.Sprintf("ORDER %d", offerID)
	expiresAt := time.Now().UTC().Add(15 * time.Minute)
	order := &models.Order{
		OfferID:                   &offerID,
		OrderCreatorWalletAddress: walletAddrPtr,
		OrderCreatorUserID:        buyerUserID,
		OrderAmount:               orderAmount,
		PayableAmount:             payableAmount,
		Status:                    constants.TradingOpen,
		TransferCode:              &transferCode,
		ExpiresAt:                 &expiresAt,
		BankInfo:                  offer.BankInfo,
	}

	if err = s.offerRepo.ReserveQuantity(ctx, offerID, orderAmount, tx); err != nil {
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
	order.OfferCreatorWalletAddress = &offer.OfferCreatorWalletAddress
	order.OfferCreatorUserID = &offer.OfferCreatorUserID
	order.PriceRate = offer.PriceRate

	return order, offer, nil
}

func (s *OrderService) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, int64, error) {
	orders, err := s.repo.ListOrdersByOffer(ctx, offerID, pagination)
	if err != nil {
		return nil, 0, err
	}

	count, err := s.repo.CountOrdersByOffer(ctx, offerID)
	if err != nil {
		return nil, 0, err
	}

	of, err := s.offerRepo.GetOfferByID(ctx, offerID)
	if err == nil && of != nil {
		for i := range orders {
			orders[i].BankInfo = of.BankInfo
			orders[i].OfferCreatorWalletAddress = &of.OfferCreatorWalletAddress
			orders[i].OfferCreatorUserID = &of.OfferCreatorUserID
			orders[i].PriceRate = of.PriceRate
		}
	}

	return orders, count, nil
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
			o.OfferCreatorWalletAddress = &of.OfferCreatorWalletAddress
			o.OfferCreatorUserID = &of.OfferCreatorUserID
			o.PriceRate = of.PriceRate
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
				orders[i].OfferCreatorWalletAddress = &of.OfferCreatorWalletAddress
				orders[i].OfferCreatorUserID = &of.OfferCreatorUserID
				orders[i].PriceRate = of.PriceRate
			}
		}
	}

	return orders, count, nil
}

// HasActiveOrdersForOffer checks if an offer has any active (PENDING or OPEN) orders
func (s *OrderService) HasActiveOrdersForOffer(ctx context.Context, offerID int64) (bool, error) {
	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	hasActive, err := s.repo.HasActiveOrders(ctx, offerID, tx)
	if err != nil {
		return false, err
	}

	return hasActive, nil
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
		if err == nil && of.OfferCreatorWalletAddress != "" {
			payload := map[string]any{"order_id": fmt.Sprint(o.OrderID), "amount": o.OrderAmount}
			go SendSocketEvent(of.OfferCreatorWalletAddress, constants.ORDER_CONFIRMED, payload)
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
	if offer != nil && offer.IntermediaryWalletAddress != nil && *offer.IntermediaryWalletAddress != "" && o.OrderCreatorWalletAddress != nil && s.blockchain != nil {
		intermediaryWallet, walletErr := s.walletRepo.GetWalletByAddress(ctx, *offer.IntermediaryWalletAddress)
		if walletErr != nil {
			err = fmt.Errorf("failed to fetch intermediary wallet: %w", walletErr)
			return err
		}

		if err = s.repo.UpdateOrderStatus(ctx, orderID, string(models.OrderStatusConfirmed), tx); err != nil {
			return err
		}

		if intermediaryWallet != nil && o.OrderAmount.Sign() > 0 {
			txHash, transferErr := s.blockchain.TransferMoney(intermediaryWallet.EncryptedPrivateKey, *offer.IntermediaryWalletAddress, *o.OrderCreatorWalletAddress, o.OrderAmount.String(), constants.TextDataP2PTrading, constants.ExtraInfoP2PTrading)
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
					if s.offerService != nil {
						s.offerService.ReleaseIntermediaryWalletIfOfferComplete(ctx, *o.OfferID, tx)
					}
					if err = s.offerRepo.CheckAndCompleteIfEmpty(ctx, *o.OfferID, tx); err != nil {
						return err
					}
				}

				if o.OrderCreatorWalletAddress != nil && *o.OrderCreatorWalletAddress != "" {
					payload := map[string]any{"order_id": fmt.Sprint(o.OrderID), "amount": o.OrderAmount, "tx_hash": txHash}
					go SendSocketEvent(*o.OrderCreatorWalletAddress, constants.ORDER_COMPLETED, payload)
				}
			} else if status == constants.TxStatusPending || status == constants.TxStatusConfirmed || status == constants.TxStatusFailed {
				// Status 0, 1, 3 = PENDING, CONFIRMED, FAILED
				if o.OfferID != nil {
					if releaseErr := s.offerRepo.ReleaseQuantity(ctx, *o.OfferID, o.OrderAmount, tx); releaseErr != nil {
						logger.Error().Err(releaseErr).Int64("offer_id", *o.OfferID).Int64("order_amount", o.OrderAmount.Int64()).Msg("Failed to release quantity after transaction failure")
					} else {
						logger.Info().Int64("offer_id", *o.OfferID).Int64("order_amount", o.OrderAmount.Int64()).Msg("Released quantity back to offer after transaction failure")
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
