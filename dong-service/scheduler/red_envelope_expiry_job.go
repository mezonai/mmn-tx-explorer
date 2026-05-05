package scheduler

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
	"time"
)

type RedEnvelopeExpiryJob struct {
	redEnvelopeRepo   *repository.RedEnvelopeRepository
	walletRepo        *repository.IntermediaryWalletRepository
	blockchainService *blockchain.BlockchainService
}

func NewRedEnvelopeExpiryJob(
	redEnvelopeRepo *repository.RedEnvelopeRepository,
	intermediaryWalletRepo *repository.IntermediaryWalletRepository,
	blockchainService *blockchain.BlockchainService,
) *RedEnvelopeExpiryJob {
	return &RedEnvelopeExpiryJob{
		redEnvelopeRepo:   redEnvelopeRepo,
		walletRepo:        intermediaryWalletRepo,
		blockchainService: blockchainService,
	}
}

func (j *RedEnvelopeExpiryJob) Run(ctx context.Context) error {
	logger.Info().Msg("Starting red envelope expiry batch job")

	expiredEnvelopes, err := j.redEnvelopeRepo.GetExpiredEnvelopes()
	if err != nil {
		logger.Error().Err(err).Msg("Error getting expired red envelopes")
		return err
	}

	if len(expiredEnvelopes) == 0 {
		logger.Info().Msg("No expired red envelopes to process")
		return nil
	}

	logger.Info().Int("count", len(expiredEnvelopes)).Msg("Found expired red envelopes")

	for _, envelope := range expiredEnvelopes {
		if err := j.processEnvelope(ctx, envelope); err != nil {
			logger.Error().
				Err(err).
				Str("red_envelope_id", envelope.ID).
				Msg("Failed to process expired envelope (continuing with the rest)")
		}
	}

	logger.Info().Msg("Red envelope expiry batch job completed")
	return nil
}

func (j *RedEnvelopeExpiryJob) RunForEnvelope(ctx context.Context, envelopeID string) error {
	if envelopeID == "" {
		return fmt.Errorf("envelopeID is empty")
	}

	envelope, err := j.redEnvelopeRepo.GetEnvelopeByID(envelopeID)
	if err != nil {
		return fmt.Errorf("fetch envelope %s: %w", envelopeID, err)
	}
	if envelope == nil {
		logger.Warn().
			Str("red_envelope_id", envelopeID).
			Msg("Envelope not found; skipping expiry")
		return nil
	}

	switch envelope.Status {
	case constants.RedEnvelopeStatusPublished, constants.RedEnvelopeStatusPending:
	default:
		logger.Info().
			Str("red_envelope_id", envelopeID).
			Str("status", envelope.Status).
			Msg("Envelope already in terminal state; skipping expiry")
		return nil
	}

	if envelope.EndDate.After(time.Now()) {
		logger.Info().
			Str("red_envelope_id", envelopeID).
			Time("end_date", envelope.EndDate).
			Msg("Envelope end_date is still in the future; skipping expiry")
		return nil
	}

	if err := j.processEnvelope(ctx, envelope); err != nil {
		return fmt.Errorf("process envelope %s: %w", envelopeID, err)
	}
	return nil
}

func (j *RedEnvelopeExpiryJob) processEnvelope(ctx context.Context, envelope *models.RedEnvelope) error {
	totalClaimed, err := j.redEnvelopeRepo.GetTotalClaimedAmount(envelope.ID)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", envelope.ID).
			Msg("Failed to get total claimed amount")
		return err
	}

	remainingBalance := envelope.TotalAmount - totalClaimed
	isSuccess := true
	var txPtr *string

	if remainingBalance > 0 {
		logger.Info().
			Str("red_envelope_id", envelope.ID).
			Int64("remaining_balance", remainingBalance).
			Str("red_envelope_wallet", envelope.RedEnvelopeWallet).
			Str("owner_wallet", envelope.OwnerWallet).
			Msg("Transferring remaining balance back to owner")

		var wallet *models.IntermediaryWallet
		wallet, err = j.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).
				Str("red_envelope_id", envelope.ID).
				Msg("Failed to get wallet for refund")
			isSuccess = false
		} else {
			amount := types.NewBigIntString(remainingBalance).Multiply(constants.TokenMultiplierBigIntString)
			txHash, txErr := j.blockchainService.TransferMoney(
				wallet.EncryptedPrivateKey,
				envelope.RedEnvelopeWallet,
				envelope.OwnerWallet,
				amount.String(),
				constants.TextDataLuckyMoney,
				constants.ExtraInfoLuckyMoney,
			)
			if txErr != nil {
				logger.Error().Err(txErr).
					Str("red_envelope_id", envelope.ID).
					Msg("Failed to transfer refund")
				isSuccess = false
			} else {
				txPtr = &txHash
			}
		}
	}

	if !isSuccess {
		logger.Warn().
			Str("red_envelope_id", envelope.ID).
			Msg("Marking red envelope as EXPIRED without refund due to errors")
		return fmt.Errorf("refund failed for envelope %s", envelope.ID)
	}

	if _, err = j.redEnvelopeRepo.UpdateRedEnvelope(ctx, envelope.ID, constants.RedEnvelopeStatusExpired, nil, txPtr); err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", envelope.ID).
			Msg("Failed to update status to EXPIRED")
		return err
	}

	wallet, err := j.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
	if err != nil {
		logger.Error().
			Err(err).
			Str("wallet_address", envelope.RedEnvelopeWallet).
			Msg("Failed to get wallet for release")
		return err
	}

	walletAge := time.Since(wallet.CreatedAt).Hours() / 24
	if walletAge > float64(constants.RedEnvelopeWalletMaxAgeInDays) {
		if err = j.walletRepo.UpdateWalletStatus(ctx, wallet.ID, constants.RedEnvelopeWalletStatusPrepareReplace); err != nil {
			logger.Error().
				Err(err).
				Int64("wallet_id", wallet.ID).
				Msg("Failed to mark wallet for replacement")
			return err
		}
		logger.Info().
			Int64("wallet_id", wallet.ID).
			Float64("age_days", walletAge).
			Msg("Marked wallet for replacement (older than max age)")
	} else {
		if err = j.walletRepo.ReleaseWallet(ctx, envelope.RedEnvelopeWallet); err != nil {
			logger.Error().
				Err(err).
				Int64("wallet_id", wallet.ID).
				Msg("Failed to release wallet")
			return err
		}
		logger.Info().
			Int64("wallet_id", wallet.ID).
			Msg("Released wallet back to pool")
	}

	logger.Info().
		Str("red_envelope_id", envelope.ID).
		Str("name", envelope.Name).
		Int64("remaining_balance", remainingBalance).
		Msg("Processed expired red envelope")
	return nil
}

func CreateRedEnvelopeExpiryJob(dongSchema string, blockchainService *blockchain.BlockchainService) (
	*RedEnvelopeExpiryJob,
	*repository.RedEnvelopeRepository,
) {
	db := database.GetDB()
	queueService := repository.NewRedEnvelopeQueueService(database.RedisClient)
	redEnvelopeWalletRepo := repository.NewIntermediaryWalletRepository(db, dongSchema)
	redEnvelopeRepo := repository.NewRedEnvelopeRepository(db, dongSchema, blockchainService, redEnvelopeWalletRepo, queueService)

	job := NewRedEnvelopeExpiryJob(redEnvelopeRepo, redEnvelopeWalletRepo, blockchainService)
	return job, redEnvelopeRepo
}
