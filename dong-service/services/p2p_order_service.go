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
	repo            *repository.OrderRepository
	offerRepo       *repository.OfferRepository
	walletRepo      *repository.IntermediaryWalletRepository
	userPaymentRepo *repository.UserPaymentInfoRepository
	blockchain      *blockchain.BlockchainService
	offerService    *OfferService
}

func NewOrderService(repo *repository.OrderRepository, offerRepo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository, userPaymentRepo *repository.UserPaymentInfoRepository, blockchain *blockchain.BlockchainService, offerService *OfferService) *OrderService {
	return &OrderService{repo: repo, offerRepo: offerRepo, walletRepo: walletRepo, userPaymentRepo: userPaymentRepo, blockchain: blockchain, offerService: offerService}
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

	if offer.Side == models.OfferSideBuy {
		if req.PaymentInfoID == nil {
			return nil, nil, fmt.Errorf("payment_info_id is required for orders on BUY offers")
		}

		if s.userPaymentRepo != nil {
			paymentInfo, err := s.userPaymentRepo.GetByID(ctx, *req.PaymentInfoID)
			if err != nil {
				return nil, nil, fmt.Errorf("failed to get payment info: %w", err)
			}
			if paymentInfo == nil {
				return nil, nil, fmt.Errorf("payment info with ID %d not found", *req.PaymentInfoID)
			}
			if paymentInfo.UserID != buyerUserID {
				return nil, nil, fmt.Errorf("payment info does not belong to the current user")
			}
		}
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
	expiresAt := time.Now().UTC().Add(constants.OrderExpirationDuration * time.Hour)

	var status string
	var paymentInfoID *int64
	if offer.Side == models.OfferSideBuy {
		status = constants.TradingWaiting
		paymentInfoID = req.PaymentInfoID // Required for BUY offers
	} else {
		status = constants.TradingOpen
		paymentInfoID = nil // Not used for SELL offers
	}

	order := &models.Order{
		OfferID:                   &offerID,
		OrderCreatorWalletAddress: walletAddrPtr,
		OrderCreatorUserID:        buyerUserID,
		OrderAmount:               orderAmount,
		PayableAmount:             payableAmount,
		Status:                    status,
		TransferCode:              &transferCode,
		ExpiresAt:                 &expiresAt,
		PaymentInfoID:             paymentInfoID,
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

	order.OfferCreatorWalletAddress = offer.OfferCreatorWalletAddress
	order.OfferCreatorUserID = offer.OfferCreatorUserID
	order.PriceRate = offer.PriceRate
	order.OfferSide = &offer.Side

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
			orders[i].OfferCreatorWalletAddress = of.OfferCreatorWalletAddress
			orders[i].OfferCreatorUserID = of.OfferCreatorUserID
			orders[i].PriceRate = of.PriceRate
			orders[i].OfferSide = &of.Side
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
			o.OfferCreatorWalletAddress = of.OfferCreatorWalletAddress
			o.OfferCreatorUserID = of.OfferCreatorUserID
			o.PriceRate = of.PriceRate
			o.OfferSide = &of.Side
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
				orders[i].OfferCreatorWalletAddress = of.OfferCreatorWalletAddress
				orders[i].OfferCreatorUserID = of.OfferCreatorUserID
				orders[i].PriceRate = of.PriceRate
				orders[i].OfferSide = &of.Side
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
	if o.Status != constants.TradingOpen {
		return fmt.Errorf("buyer can only confirm open or waiting_transfer orders; current status=%s", o.Status)
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

	// Send ORDER_CONFIRMED event to the seller (the other party)
	if o.OfferID != nil {
		of, err := s.offerRepo.GetOfferByID(context.Background(), *o.OfferID)
		if err == nil && of != nil {
			receiverAddress := of.OfferCreatorWalletAddress
			if of.Side == models.OfferSideBuy {
				receiverAddress = o.OrderCreatorWalletAddress
			}

			if receiverAddress != nil && *receiverAddress != "" {
				payload := map[string]any{"order_id": fmt.Sprint(o.OrderID), "amount": o.OrderAmount}
				go SendSocketEvent(*receiverAddress, constants.ORDER_CONFIRMED, payload)
			}
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

		var targetWallet *string
		var extraInfo string
		if offer.Side == models.OfferSideBuy {
			targetWallet = offer.OfferCreatorWalletAddress
			extraInfo = constants.ExtraInfoP2PTradingBuyOffer
		} else {
			targetWallet = o.OrderCreatorWalletAddress
			extraInfo = constants.ExtraInfoP2PTrading
		}

		if intermediaryWallet != nil && o.OrderAmount.Sign() > 0 {
			txHash, transferErr := s.blockchain.TransferMoney(intermediaryWallet.EncryptedPrivateKey, *offer.IntermediaryWalletAddress, *targetWallet, o.OrderAmount.String(), fmt.Sprintf("%s Order %d", constants.TextDataP2PTrading, orderID), extraInfo)
			if transferErr != nil {
				err = fmt.Errorf("failed to transfer money: %w", transferErr)
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

				// Send ORDER_COMPLETED event to the buyer (the other party)
				receiverAddress := o.OrderCreatorWalletAddress
				if offer.Side == models.OfferSideBuy {
					receiverAddress = offer.OfferCreatorWalletAddress
				}

				if receiverAddress != nil && *receiverAddress != "" {
					payload := map[string]any{"order_id": fmt.Sprint(o.OrderID), "amount": o.OrderAmount, "tx_hash": txHash}
					go SendSocketEvent(*receiverAddress, constants.ORDER_COMPLETED, payload)
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
