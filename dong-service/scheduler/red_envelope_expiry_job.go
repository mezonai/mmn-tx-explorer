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
	logger.Info().Msg("Starting red envelope expiry job")

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
		totalClaimed, err := j.redEnvelopeRepo.GetTotalClaimedAmount(envelope.ID)
		if err != nil {
			logger.Error().
				Err(err).
				Str("red_envelope_id", envelope.ID).
				Msg("Failed to get total claimed amount")
			continue
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
				// TODO: update pass amount from envelope
				amount := types.NewBigIntString(remainingBalance).Multiply(constants.TokenMultiplierBigIntString)
				txHash, txErr := j.blockchainService.TransferMoney(wallet.EncryptedPrivateKey, envelope.RedEnvelopeWallet, envelope.OwnerWallet, amount.String(), constants.TextDataLuckyMoney, constants.ExtraInfoLuckyMoney)
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
			continue
		}

		_, err = j.redEnvelopeRepo.UpdateRedEnvelope(ctx, envelope.ID, constants.RedEnvelopeStatusExpired, nil, txPtr)
		if err != nil {
			logger.Error().
				Err(err).
				Str("red_envelope_id", envelope.ID).
				Msg("Failed to update status to EXPIRED")
			continue
		}

		wallet, err := j.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().
				Err(err).
				Str("wallet_address", envelope.RedEnvelopeWallet).
				Msg("Failed to get wallet for release")
			continue
		}

		walletAge := time.Since(wallet.CreatedAt).Hours() / 24
		if walletAge > float64(constants.RedEnvelopeWalletMaxAgeInDays) {
			err = j.walletRepo.UpdateWalletStatus(ctx, wallet.ID, constants.RedEnvelopeWalletStatusPrepareReplace)
			if err != nil {
				logger.Error().
					Err(err).
					Int64("wallet_id", wallet.ID).
					Msg("Failed to mark wallet for replacement")
			} else {
				logger.Info().
					Int64("wallet_id", wallet.ID).
					Float64("age_days", walletAge).
					Msg("Marked wallet for replacement (older than 30 days)")
			}
		} else {
			err = j.walletRepo.ReleaseWallet(ctx, envelope.RedEnvelopeWallet)
			if err != nil {
				logger.Error().
					Err(err).
					Int64("wallet_id", wallet.ID).
					Msg("Failed to release wallet")
			} else {
				logger.Info().
					Int64("wallet_id", wallet.ID).
					Msg("Released wallet back to pool")
			}
		}

		logger.Info().
			Str("red_envelope_id", envelope.ID).
			Str("name", envelope.Name).
			Int64("remaining_balance", remainingBalance).
			Msg("Processed expired red envelope")
	}

	logger.Info().Msg("Red envelope expiry job completed")
	return nil
}

func CreateRedEnvelopeExpiryTask(interval time.Duration, dongSchema string, blockchainService *blockchain.BlockchainService) Task {
	db := database.GetDB()
	queueService := repository.NewRedEnvelopeQueueService(database.RedisClient)
	redEnvelopeWalletRepo := repository.NewIntermediaryWalletRepository(db, dongSchema)
	redEnvelopeRepo := repository.NewRedEnvelopeRepository(db, dongSchema, blockchainService, redEnvelopeWalletRepo, queueService)

	job := NewRedEnvelopeExpiryJob(redEnvelopeRepo, redEnvelopeWalletRepo, blockchainService)

	return Task{
		Name:     "red_envelope_expiry",
		Interval: interval,
		Job:      job.Run,
	}
}
