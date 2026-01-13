package scheduler

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/repository"
	"encoding/json"
	"fmt"
	"math/big"
	"time"
)

const (
	transactionLookbackHours = 24
	maxTransactionsToScan    = 20
	amountMultiplier         = 1000000
)

type SyncOffersJob struct {
	db            *sql.DB
	indexerSchema string
	dongSchema    string
	offerRepo     *repository.OfferRepository
	walletRepo    *repository.IntermediaryWalletRepository
}

// NewSyncOffersJob creates a new sync offers job
func NewSyncOffersJob(db *sql.DB, indexerSchema, dongSchema string, offerRepo *repository.OfferRepository, walletRepo *repository.IntermediaryWalletRepository) *SyncOffersJob {
	return &SyncOffersJob{
		db:            db,
		indexerSchema: indexerSchema,
		dongSchema:    dongSchema,
		offerRepo:     offerRepo,
		walletRepo:    walletRepo,
	}
}

type ExtraInfoType struct {
	Type    string `json:"type"`
	OfferID *int64 `json:"offer_id,omitempty"` // For p2p-trading transactions
}

func (j *SyncOffersJob) Run(ctx context.Context) error {
	startTime := time.Now()
	logger.Info().Msg("Starting sync offers job")

	pendingOffers, err := j.getPendingOffers(ctx)
	if err != nil {
		return fmt.Errorf("failed to get pending offers: %w", err)
	}

	if len(pendingOffers) == 0 {
		logger.Debug().Msg("No pending offers found")
		return nil
	}

	logger.Info().
		Int("offer_count", len(pendingOffers)).
		Msg("Found pending offers to sync")

	confirmed := 0
	failed := 0
	notFound := 0

	for _, offer := range pendingOffers {
		isConfirmed, err := j.processOffer(ctx, offer)
		if err != nil {
			logger.Error().
				Err(err).
				Int64("offer_id", offer.OfferID).
				Str("intermediary_wallet", offer.IntermediaryWallet).
				Msg("Failed to process offer")
			failed++
			continue
		}
		if isConfirmed {
			confirmed++
		} else {
			notFound++
		}
	}

	duration := time.Since(startTime)
	logger.Info().
		Int("total_offers", len(pendingOffers)).
		Int("confirmed", confirmed).
		Int("not_found", notFound).
		Int("failed", failed).
		Dur("duration", duration).
		Msg("Sync offers job completed")

	return nil
}

type PendingOffer struct {
	OfferID            int64
	SellerWallet       string
	IntermediaryWallet string
	Amount             int64
	Status             string
}

func (j *SyncOffersJob) getPendingOffers(ctx context.Context) ([]PendingOffer, error) {
	query := fmt.Sprintf(`
		SELECT offer_id, seller_wallet_address, intermediary_wallet_address, amount, status
		FROM %s.offers
		WHERE status = $1
			AND transaction_hash IS NULL
			AND intermediary_wallet_address IS NOT NULL
		ORDER BY created_at ASC
	`, j.dongSchema)

	rows, err := j.db.QueryContext(ctx, query, constants.TradingOpen)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending offers: %w", err)
	}
	defer rows.Close()

	offers := make([]PendingOffer, 0)
	for rows.Next() {
		var offer PendingOffer
		if err := rows.Scan(&offer.OfferID, &offer.SellerWallet, &offer.IntermediaryWallet, &offer.Amount, &offer.Status); err != nil {
			return nil, fmt.Errorf("failed to scan offer: %w", err)
		}
		offers = append(offers, offer)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating offers: %w", err)
	}

	return offers, nil
}

func (j *SyncOffersJob) processOffer(ctx context.Context, offer PendingOffer) (bool, error) {
	lookbackTime := time.Now().Add(-transactionLookbackHours * time.Hour)

	query := fmt.Sprintf(`
		SELECT hash, from_address, to_address, value, status, extra_info, created_at
		FROM %s.transactions
		WHERE from_address = $1
			AND to_address = $2
			AND (status = 1 OR status = 2)
			AND extra_info IS NOT NULL
			AND created_at >= $3
		ORDER BY created_at DESC
		LIMIT %d
	`, j.indexerSchema, maxTransactionsToScan)

	rows, err := j.db.QueryContext(ctx, query,
		offer.SellerWallet,
		offer.IntermediaryWallet,
		lookbackTime,
	)
	if err != nil {
		return false, fmt.Errorf("failed to query transactions: %w", err)
	}
	defer rows.Close()

	expectedAmount := big.NewInt(offer.Amount * amountMultiplier)

	for rows.Next() {
		var txHash, fromAddr, toAddr, valueStr string
		var extraInfo sql.NullString
		var status int32
		var createdAt time.Time

		if err := rows.Scan(&txHash, &fromAddr, &toAddr, &valueStr, &status, &extraInfo, &createdAt); err != nil {
			logger.Error().Err(err).Msg("Failed to scan transaction")
			continue
		}

		if !extraInfo.Valid || extraInfo.String == "" {
			logger.Debug().
				Str("tx_hash", txHash).
				Msg("Transaction has no extra_info, skipping")
			continue
		}

		var extraInfoData ExtraInfoType
		if err := json.Unmarshal([]byte(extraInfo.String), &extraInfoData); err != nil {
			logger.Debug().
				Str("tx_hash", txHash).
				Str("extra_info", extraInfo.String).
				Msg("Failed to parse extra_info, skipping")
			continue
		}

		if extraInfoData.Type != "p2p-trading" {
			logger.Debug().
				Str("tx_hash", txHash).
				Str("type", extraInfoData.Type).
				Msg("Not a p2p-trading transaction, skipping")
			continue
		}

		if extraInfoData.OfferID != nil && *extraInfoData.OfferID != offer.OfferID {
			logger.Debug().
				Str("tx_hash", txHash).
				Int64("expected_offer_id", offer.OfferID).
				Int64("actual_offer_id", *extraInfoData.OfferID).
				Msg("Transaction offer_id mismatch, skipping")
			continue
		}

		txValue := new(big.Int)
		if _, ok := txValue.SetString(valueStr, 10); !ok {
			logger.Error().
				Str("tx_hash", txHash).
				Str("value", valueStr).
				Msg("Failed to parse transaction value")
			continue
		}

		if txValue.Cmp(expectedAmount) != 0 {
			logger.Debug().
				Str("tx_hash", txHash).
				Str("expected", expectedAmount.String()).
				Str("actual", txValue.String()).
				Msg("Transaction amount mismatch, skipping")
			continue
		}

		exists, err := j.offerRepo.ExistsByTxHash(ctx, txHash)
		if err != nil {
			logger.Error().
				Err(err).
				Str("tx_hash", txHash).
				Msg("Failed to check if tx_hash exists")
			continue
		}
		if exists {
			logger.Debug().
				Str("tx_hash", txHash).
				Msg("Transaction hash already used by another offer")
			continue
		}

		if err := j.updateOfferStatus(ctx, offer.OfferID, txHash); err != nil {
			return false, fmt.Errorf("failed to update offer status: %w", err)
		}

		logger.Info().
			Int64("offer_id", offer.OfferID).
			Str("tx_hash", txHash).
			Str("seller", fromAddr).
			Str("intermediary", toAddr).
			Int64("amount", offer.Amount).
			Msg("Offer confirmed with P2P trading transaction")

		return true, nil
	}

	if err := rows.Err(); err != nil {
		return false, fmt.Errorf("error iterating transactions: %w", err)
	}

	return false, nil
}

func (j *SyncOffersJob) updateOfferStatus(ctx context.Context, offerID int64, txHash string) error {
	tx, err := j.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if err := j.offerRepo.UpdateOfferStatus(ctx, offerID, constants.TradingConfirmed, tx, &txHash); err != nil {
		return fmt.Errorf("failed to update offer status: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func CreateSyncOffersTask(interval time.Duration, indexerSchema, dongSchema string) Task {
	db := database.GetDB()
	offerRepo := repository.NewOfferRepository(db, dongSchema)
	walletRepo := repository.NewIntermediaryWalletRepository(db, dongSchema)

	job := NewSyncOffersJob(db, indexerSchema, dongSchema, offerRepo, walletRepo)

	return Task{
		Name:     "sync_offers",
		Interval: interval,
		Job:      job.Run,
	}
}
