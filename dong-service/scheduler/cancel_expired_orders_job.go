package scheduler

import (
	"context"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/repository"
	"dong-service/services"
	"time"
)

type CancelExpiredOrdersJob struct {
	orderRepo     *repository.OrderRepository
	walletRepo    *repository.IntermediaryWalletRepository
	blockchainSvc *blockchain.BlockchainService
}

func NewCancelExpiredOrdersJob(
	orderRepo *repository.OrderRepository,
	walletRepo *repository.IntermediaryWalletRepository,
	blockchainSvc *blockchain.BlockchainService,
) *CancelExpiredOrdersJob {
	return &CancelExpiredOrdersJob{
		orderRepo:     orderRepo,
		walletRepo:    walletRepo,
		blockchainSvc: blockchainSvc,
	}
}

func (j *CancelExpiredOrdersJob) Run(ctx context.Context) error {
	logger.Info().Msg("Starting cancel expired orders job")

	cutoff := time.Now().UTC()

	expiredOrdersInfo, err := j.orderRepo.GetExpiredOrdersForRefund(ctx, cutoff)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get expired orders info")
	}

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error().Err(err).Msg("failed to begin tx for cancel expired orders")
		return err
	}

	count, err := j.orderRepo.CancelExpiredOrders(ctx, cutoff, tx)
	if err != nil {
		_ = tx.Rollback()
		logger.Error().Err(err).Msg("failed cancelling expired orders")
		return err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		logger.Error().Err(err).Msg("failed commit cancel expired orders")
		return err
	}

	if count > 0 {
		logger.Info().Int64("count", count).Msg("Cancelled expired orders")

		if len(expiredOrdersInfo) > 0 && j.walletRepo != nil && j.blockchainSvc != nil {
			j.processRefunds(ctx, expiredOrdersInfo)
		}

		go services.SendSocketEvent(constants.OFFER_ROOM, constants.OFFER_LIST_REFRESH, map[string]any{
			"action": "expired p2p orders",
		})

	} else {
		logger.Debug().Msg("No expired orders to cancel")
	}

	return nil
}

func (j *CancelExpiredOrdersJob) processRefunds(ctx context.Context, expiredOrders []repository.ExpiredOrderInfo) {
	for _, orderInfo := range expiredOrders {
		if orderInfo.Status != constants.TradingPending {
			continue
		}

		if orderInfo.IntermediaryWalletAddress == "" {
			logger.Warn().
				Int64("order_id", orderInfo.OrderID).
				Msg("Skipping refund: missing intermediary wallet address")
			continue
		}

		var refundRecipient string

		if orderInfo.OfferSide == constants.OfferSideBuy {
			refundRecipient = orderInfo.OrderCreatorWalletAddress
		}

		if refundRecipient == "" {
			logger.Warn().
				Int64("order_id", orderInfo.OrderID).
				Str("offer_side", orderInfo.OfferSide).
				Msg("Skipping refund: missing recipient wallet address")
			continue
		}

		logger.Info().
			Int64("order_id", orderInfo.OrderID).
			Int64("offer_id", orderInfo.OfferID).
			Str("amount", orderInfo.OrderAmount).
			Str("status", orderInfo.Status).
			Str("offer_side", orderInfo.OfferSide).
			Str("recipient_wallet", refundRecipient).
			Msg("Processing refund for expired PENDING order")

		wallet, err := j.walletRepo.GetWalletByAddress(ctx, orderInfo.IntermediaryWalletAddress)
		if err != nil {
			logger.Error().
				Err(err).
				Int64("order_id", orderInfo.OrderID).
				Str("intermediary_wallet", orderInfo.IntermediaryWalletAddress).
				Msg("Failed to fetch intermediary wallet for refund")
			continue
		}

		if wallet == nil {
			logger.Error().
				Int64("order_id", orderInfo.OrderID).
				Str("intermediary_wallet", orderInfo.IntermediaryWalletAddress).
				Msg("Intermediary wallet not found for refund")
			continue
		}

		txHash, err := j.blockchainSvc.TransferMoney(
			wallet.EncryptedPrivateKey,
			orderInfo.IntermediaryWalletAddress,
			refundRecipient,
			orderInfo.OrderAmount,
			constants.TextDataP2PTrading,
			constants.ExtraInfoP2PTradingOrderExpired,
		)

		if err != nil {
			logger.Error().
				Err(err).
				Int64("order_id", orderInfo.OrderID).
				Str("recipient_wallet", refundRecipient).
				Str("amount", orderInfo.OrderAmount).
				Msg("Failed to transfer refund for expired order")
			continue
		}

		status, err := j.blockchainSvc.CheckTransactionStatus(txHash)
		if err != nil {
			logger.Error().
				Err(err).
				Int64("order_id", orderInfo.OrderID).
				Str("tx_hash", txHash).
				Msg("Failed to check refund transaction status")
			continue
		}

		if status == constants.TxStatusFinalized {
			logger.Info().
				Int64("order_id", orderInfo.OrderID).
				Str("tx_hash", txHash).
				Str("recipient_wallet", refundRecipient).
				Str("offer_side", orderInfo.OfferSide).
				Str("amount", orderInfo.OrderAmount).
				Msg("Successfully refunded expired PENDING order")
		} else {
			logger.Warn().
				Int64("order_id", orderInfo.OrderID).
				Str("tx_hash", txHash).
				Int32("status", status).
				Msg("Refund transaction not yet finalized")
		}
	}
}

func CreateCancelExpiredOrdersTask(interval time.Duration, dongSchema string, blockchainService *blockchain.BlockchainService) Task {
	db := database.GetDB()
	orderRepo := repository.NewOrderRepository(db, dongSchema)
	walletRepo := repository.NewIntermediaryWalletRepository(db, dongSchema)

	job := NewCancelExpiredOrdersJob(orderRepo, walletRepo, blockchainService)

	return Task{
		Name:     "cancel_expired_orders",
		Interval: interval,
		Job:      job.Run,
	}
}
