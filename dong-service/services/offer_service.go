package services

import (
	"context"
	"database/sql"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
)

type OfferService struct {
	repo           *repository.OfferRepository
	walletRepo     *repository.IntermediaryWalletRepository
	userWalletRepo *repository.WalletRepository
	orderRepo      *repository.OrderRepository
	blockchain     *blockchain.BlockchainService
	orderService   *OrderService
}

func NewOfferService(repo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository, userWalletRepo *repository.WalletRepository, orderRepo *repository.OrderRepository, blockchain *blockchain.BlockchainService) *OfferService {
	return &OfferService{repo: repo, walletRepo: walletRepo, userWalletRepo: userWalletRepo, orderRepo: orderRepo, blockchain: blockchain}
}

// SetOrderService sets the order service dependency (to avoid circular dependency)
func (s *OfferService) SetOrderService(orderService *OrderService) {
	s.orderService = orderService
}

type IOfferService interface {
	CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string, sellerUserID string) (*models.Offer, error)
	ListOffers(ctx context.Context, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error)
	CountOffers(ctx context.Context, walletAddress *string, minPrice *string, maxPrice *string, statuses []string, symbol *string, rate *string, fromAmount *string, toAmount *string) (int64, error)
	GetOfferByID(ctx context.Context, id int64) (*models.Offer, error)
	GetOffersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any, fromAmount *string, toAmount *string) ([]models.Offer, int64, error)
	CancelOffer(ctx context.Context, offerId int64, offer *models.Offer) error
}

func (s *OfferService) CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string, sellerUserID string) (*models.Offer, error) {
	activeOfferCount, err := s.repo.CountActiveOffersByUser(ctx, sellerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to check active offer count: %w", err)
	}
	if activeOfferCount >= constants.MaxActiveOffersPerUser {
		return nil, constants.ErrOfferLimitExceeded
	}

	amountInt := req.Amount

	if s.userWalletRepo != nil {
		userWallet, err := s.userWalletRepo.GetByAddress(walletAddr)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Warn().Str("wallet", walletAddr).Msg("Wallet not indexed yet, skipping balance check")
			} else {
				return nil, fmt.Errorf("failed to get wallet balance: %w", err)
			}
		} else {
			balanceInt, parseErr := strconv.ParseInt(userWallet.Balance, 10, 64)
			if parseErr != nil {
				return nil, fmt.Errorf("invalid wallet balance format: %w", parseErr)
			}

			requiredBalance := amountInt * 1000000
			if balanceInt < requiredBalance {
				return nil, constants.ErrInsufficientAccountBalance
			}
		}
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
		limitMinInt = req.Limit.Min
		limitMaxInt = req.Limit.Max
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
		SellerUserID:              sellerUserID,
		Side:                      req.Side,
		Symbol:                    req.Symbol,
		Amount:                    amountInt,
		TotalAmount:               amountInt,
		PayableAmount:             priceInt,
		Status:                    constants.TradingOpen,
		BankInfo:                  bankInfoStr,
		Limit:                     &models.OfferLimit{Min: limitMinInt, Max: limitMaxInt},
	}

	var priceRateFloat *float64
	if req.PriceRate != nil && *req.PriceRate != "" {
		if r, parseErr := strconv.ParseFloat(*req.PriceRate, 64); parseErr == nil {
			priceRateFloat = &r
		}
	}
	// default to 1.0 if not provided
	if priceRateFloat == nil {
		def := 1.0
		priceRateFloat = &def
	}
	offer.PriceRate = priceRateFloat

	if priceRateFloat != nil {
		computed := float64(amountInt) * (*priceRateFloat)
		priceInt = int64(math.Round(computed))
	}
	offer.PayableAmount = priceInt

	if err = s.repo.CreateOffer(ctx, offer, tx); err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return offer, nil
}

func (s *OfferService) ListOffers(ctx context.Context, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error) {
	offers, err := s.repo.ListOffers(ctx, nil, nil, nil, nil, nil, fromAmount, toAmount, pagination)
	if err != nil || len(offers) == 0 {
		return offers, err
	}

	// Extract offer IDs
	offerIDs := make([]int64, len(offers))
	for i, offer := range offers {
		offerIDs[i] = offer.OfferID
	}

	// Get active orders map
	activeOrdersMap, err := s.orderRepo.HasActiveOrdersByOfferList(ctx, offerIDs)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to check active orders for offers")
		return offers, nil
	}

	// Map has_active_order to offers
	for i := range offers {
		hasActive := activeOrdersMap[offers[i].OfferID]
		offers[i].HasActiveOrder = &hasActive
	}

	go SendSocketEvent(constants.OFFER_ROOM, constants.OFFER_ROOM, map[string]any{})

	return offers, nil
}

func (s *OfferService) CountOffers(ctx context.Context, walletAddress *string, minPrice *string, maxPrice *string, statuses []string, symbol *string, rate *string, fromAmount *string, toAmount *string) (int64, error) {
	return s.repo.CountOffers(ctx, walletAddress, minPrice, maxPrice, statuses, symbol, rate, fromAmount, toAmount)
}

func (s *OfferService) GetOfferByID(ctx context.Context, id int64) (*models.Offer, error) {
	offer, err := s.repo.GetOfferByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Check if this offer has active orders
	if s.orderService != nil && offer != nil {
		hasActive, checkErr := s.orderService.HasActiveOrdersForOffer(ctx, id)
		if checkErr == nil {
			offer.HasActiveOrder = &hasActive
		}
	}

	return offer, nil
}

func (s *OfferService) GetOffersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any, fromAmount *string, toAmount *string) ([]models.Offer, int64, error) {
	offers, err := s.repo.GetOffersByWalletAddress(ctx, walletAddress, pagination, fromAmount, toAmount)
	if err != nil {
		return nil, 0, err
	}
	count, err := s.repo.CountOffers(ctx, &walletAddress, nil, nil, nil, nil, nil, fromAmount, toAmount)
	if err != nil {
		return nil, 0, err
	}

	// Add has_active_order field
	if len(offers) > 0 {
		offerIDs := make([]int64, len(offers))
		for i, offer := range offers {
			offerIDs[i] = offer.OfferID
		}

		activeOrdersMap, err := s.orderRepo.HasActiveOrdersByOfferList(ctx, offerIDs)
		if err == nil {
			for i := range offers {
				hasActive := activeOrdersMap[offers[i].OfferID]
				offers[i].HasActiveOrder = &hasActive
			}
		}
	}

	return offers, count, nil
}

func (s *OfferService) CancelOffer(ctx context.Context, offerId int64, offer *models.Offer) error {
	if offer.Status != constants.TradingOpen && offer.Status != constants.TradingConfirmed {
		return fmt.Errorf("cannot cancel offer with status: %s", offer.Status)
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

	hasActive, err := s.orderRepo.HasActiveOrders(ctx, offerId, tx)
	if err != nil {
		return err
	}
	if hasActive {
		return fmt.Errorf(constants.ErrFailedToCancelOfferWithOrder)
	}

	needsRefund :=
		offer.Status == constants.TradingConfirmed &&
			offer.IntermediaryWalletAddress != nil &&
			*offer.IntermediaryWalletAddress != "" &&
			offer.Amount > 0 &&
			s.blockchain != nil &&
			s.walletRepo != nil

	if needsRefund {
		intermediaryWallet, err := s.walletRepo.GetWalletByAddress(ctx, *offer.IntermediaryWalletAddress)
		if err != nil {
			return err
		}

		if intermediaryWallet == nil {
			return fmt.Errorf("intermediary wallet not found")
		}

		txHash, err := s.blockchain.TransferMoney(
			intermediaryWallet.EncryptedPrivateKey,
			*offer.IntermediaryWalletAddress,
			offer.SellerWalletAddress,
			offer.Amount,
			constants.TextDataP2PTrading,
			constants.ExtraInfoP2PTradingOfferCanceled,
		)
		if err != nil {
			logger.Error().Err(err).Int64("offer_id", offerId).Msg(constants.ErrFailedToRefundOfferAmount)
			return err
		}

		status, err := s.blockchain.CheckTransactionStatus(txHash)

		if err == nil && status == constants.TxStatusFinalized {
			logger.Info().Int64("offer_id", offerId).Str("tx_hash", txHash).Msg("Refund transaction finalized for canceled offer")
			if err = s.repo.UpdateOfferStatus(ctx, offerId, constants.TradingCanceled, tx, nil); err != nil {
				return err
			}

			if offer.IntermediaryWalletAddress != nil && *offer.IntermediaryWalletAddress != "" && s.walletRepo != nil {
				logger.Info().Int64("offer_id", offerId).Str("wallet_address", *offer.IntermediaryWalletAddress).Msg("Releasing intermediary wallet for canceled offer")
				s.releaseIntermediaryWallet(ctx, *offer.IntermediaryWalletAddress)
			}
		} else if status == constants.TxStatusPending || status == constants.TxStatusConfirmed || status == constants.TxStatusFailed {
			err = fmt.Errorf("refund transaction not finalized yet for canceled offer")
			return err
		} else if err != nil {
			return err
		}
	} else {
		err = fmt.Errorf(constants.ErrFailedToCancelOffer)
		return err
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	go SendSocketEvent(constants.OFFER_ROOM, constants.OFFER_LIST_REFRESH, map[string]any{
		"action": "cancelled p2p offer",
	})

	return nil
}

func (s *OfferService) releaseIntermediaryWallet(ctx context.Context, walletAddress string) {
	wallet, walletErr := s.walletRepo.GetWalletByAddress(ctx, walletAddress)
	if walletErr == nil && wallet != nil {
		if updateErr := s.walletRepo.UpdateWalletStatus(ctx, wallet.ID, constants.RedEnvelopeWalletStatusReady); updateErr != nil {
			logger.Error().Err(updateErr).Int64("wallet_id", wallet.ID).Msg("Failed to reset intermediary wallet status")
		} else {
			logger.Info().Int64("wallet_id", wallet.ID).Str("address", walletAddress).Msg("Released intermediary wallet")
		}
	}
}

func (s *OfferService) ReleaseIntermediaryWalletIfOfferComplete(ctx context.Context, offerID int64, tx *sql.Tx) {
	updatedOffer, getErr := s.repo.GetOfferByIDForUpdate(ctx, offerID, tx)
	if getErr == nil && updatedOffer != nil && updatedOffer.Amount == 0 {
		if updatedOffer.IntermediaryWalletAddress != nil && *updatedOffer.IntermediaryWalletAddress != "" {
			s.releaseIntermediaryWallet(ctx, *updatedOffer.IntermediaryWalletAddress)
		}
	}
}
