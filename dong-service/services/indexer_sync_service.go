package services

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/types"
	"fmt"
)

type IndexerSyncService struct {
	db         *sql.DB
	offerRepo  *repository.OfferRepository
	orderRepo  *repository.OrderRepository
	reRepo     *repository.RedEnvelopeRepository
	walletRepo *repository.IntermediaryWalletRepository
	feedRepo   *repository.DonationCampaignFeedRepository
	dongSchema string
}

func NewIndexerSyncService(
	db *sql.DB,
	offerRepo *repository.OfferRepository,
	orderRepo *repository.OrderRepository,
	reRepo *repository.RedEnvelopeRepository,
	walletRepo *repository.IntermediaryWalletRepository,
	feedRepo *repository.DonationCampaignFeedRepository,
	dongSchema string,
) *IndexerSyncService {
	return &IndexerSyncService{
		db:         db,
		offerRepo:  offerRepo,
		orderRepo:  orderRepo,
		reRepo:     reRepo,
		walletRepo: walletRepo,
		feedRepo:   feedRepo,
		dongSchema: dongSchema,
	}
}

func (s *IndexerSyncService) ProcessBatch(ctx context.Context, msg *types.DongBatchMessage) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin sync transaction: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// 1. Process Offer Updates
	for _, u := range msg.OfferUpdates {
		if err = s.offerRepo.UpdateOfferStatus(ctx, u.OfferID, u.Status, tx, &u.TxHash); err != nil {
			logger.Error().Err(err).Int64("offer_id", u.OfferID).Msg("Failed to update offer status from sync")
			return err
		}

		// If offer failed, release its intermediary wallet if any
		if u.Status == constants.TradingFailed {
			offer, err := s.offerRepo.GetOfferByID(ctx, u.OfferID)
			if err == nil && offer.IntermediaryWalletAddress != nil {
				if err := s.walletRepo.ReleaseWalletWithTx(ctx, tx, *offer.IntermediaryWalletAddress); err != nil {
					logger.Error().Err(err).Str("wallet", *offer.IntermediaryWalletAddress).Msg("Failed to release intermediary wallet from sync")
					// Not returning error here to allow other updates to proceed, but logging it
				}
			}
		}
	}

	if len(msg.OfferUpdates) > 0 {
		go SendSocketEvent(constants.OFFER_ROOM, constants.OFFER_LIST_REFRESH, map[string]any{
			"action": "updated p2p offer status",
		})
	}

	// 2. Process Order Updates
	for _, u := range msg.OrderUpdates {
		if err = s.orderRepo.UpdateOrderStatusWithTxHash(ctx, u.OrderID, u.Status, &u.TxHash, tx); err != nil {
			logger.Error().Err(err).Int64("order_id", u.OrderID).Msg("Failed to update order status from sync")
			return err
		}

		// If order failed, release quantity back to offer
		if u.Status == constants.TradingFailed {
			order, err := s.orderRepo.GetOrderByID(ctx, u.OrderID)
			if err == nil {
				if err := s.offerRepo.ReleaseQuantity(ctx, u.OfferID, order.OrderAmount, tx); err != nil {
					logger.Error().Err(err).Int64("offer_id", u.OfferID).Msg("Failed to release quantity from sync")
				}
			}
		}
	}

	// 3. Process Red Envelope Updates
	for _, u := range msg.RedEnvelopeUpdates {
		// Note: UpdateStatusInternal only works if it's PENDING
		// But indexer might send updates for other statuses too if we expand it.
		// For now, let's use a more generic update if UpdateStatusInternal doesn't fit or just call it.
		// Since Indexer already validated, we can just update status.
		query := fmt.Sprintf("UPDATE %s.red_envelope SET status = $1, transaction_hash = $2, updated_at = NOW() WHERE id = $3", s.dongSchema)
		if _, err = tx.ExecContext(ctx, query, u.Status, u.TxHash, u.ID); err != nil {
			logger.Error().Err(err).Str("re_id", u.ID).Msg("Failed to update red envelope status from sync")
			return err
		}
	}

	// 4. Process Red Envelope Claim Updates
	for _, u := range msg.RedEnvelopeClaimUpdates {
		query := fmt.Sprintf("UPDATE %s.red_envelope_claim SET status = $1, transaction_hash = $2, claimed_at = NOW() WHERE id = $3", s.dongSchema)
		if _, err = tx.ExecContext(ctx, query, u.Status, u.TxHash, u.ClaimID); err != nil {
			logger.Error().Err(err).Int64("claim_id", u.ClaimID).Msg("Failed to update red envelope claim status from sync")
			return err
		}
	}

	// 5. Process User Contents
	for _, c := range msg.UserContents {
		feed := &models.DonationCampaignFeed{
			TxHash:            c.TxHash,
			CreatorAddress:    c.CreatorAddress,
			CampaignAddress:   c.RelatedAddress,
			Title:             c.Title,
			Description:       c.Description,
			ImageCIDs:         c.ImageCIDs,
			ParentHash:        c.ParentHash,
			RootHash:          c.RootHash,
			ReferenceTxHashes: c.ReferenceTxHashes,
			Visible:           true,
			CreatedAt:         c.CreatedAt,
		}
		if err = s.feedRepo.InsertUserContent(ctx, tx, feed); err != nil {
			logger.Error().Err(err).Str("tx_hash", c.TxHash).Msg("Failed to insert user content from sync")
			return err
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit sync transaction: %w", err)
	}

	return nil
}
