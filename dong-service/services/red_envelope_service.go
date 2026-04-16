package services

import (
	"context"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/utils"
	"time"
)

type RedEnvelopeService struct {
	repo       *repository.RedEnvelopeRepository
	walletRepo *repository.IntermediaryWalletRepository
	queue      *repository.RedEnvelopeQueueService
}

func NewRedEnvelopeService(repo *repository.RedEnvelopeRepository, walletRepo *repository.IntermediaryWalletRepository, queue *repository.RedEnvelopeQueueService) *RedEnvelopeService {
	return &RedEnvelopeService{
		repo:       repo,
		walletRepo: walletRepo,
		queue:      queue,
	}
}

func (s *RedEnvelopeService) InternalUpdateStatusBatch(ctx context.Context, updates []models.UpdateRedEnvelopeStatusRequest) (int, error) {
	for _, req := range updates {
		var statusRedEnvelope string
		switch req.Status {
		case constants.StatusFailed:
			statusRedEnvelope = constants.RedEnvelopeStatusFailed
		default:
			statusRedEnvelope = constants.RedEnvelopeStatusPublished
		}

		envelope, err := s.repo.UpdateStatusInternal(ctx, req.ID, statusRedEnvelope, req.TransactionHash)
		if err != nil {
			logger.Error().Err(err).Str("envelope_id", req.ID).Msg("Failed to update red envelope status internally")
			// We continue for others even if one fails in batch
			continue
		}

		// Handle wallet release if status is FAILED
		if statusRedEnvelope == constants.RedEnvelopeStatusFailed {
			if err := s.walletRepo.ReleaseWallet(ctx, envelope.RedEnvelopeWallet); err != nil {
				logger.Error().Err(err).Str("address", envelope.RedEnvelopeWallet).Msg("Failed to release intermediary wallet")
			} else {
				logger.Info().Str("address", envelope.RedEnvelopeWallet).Msg("Released intermediary wallet")
			}
		}

		// Handle queue initialization if status is PUBLISHED
		if statusRedEnvelope == constants.RedEnvelopeStatusPublished && s.queue != nil {
			ttl := time.Duration(constants.RedEnvelopeDefaultTTLHours) * time.Hour
			if envelope.EndDate != nil {
				ttl = time.Until(*envelope.EndDate)
				if ttl < 0 {
					ttl = time.Duration(constants.RedEnvelopeMinTTLHours) * time.Hour
				}
			}

			var amounts []int64
			var errGen error
			if envelope.IsRandomDistribution && envelope.MinAmount != nil && envelope.MaxAmount != nil {
				amounts, errGen = utils.GenerateRandomAmounts(envelope.TotalAmount, *envelope.MinAmount, *envelope.MaxAmount, int(envelope.TotalClaims))
				if errGen != nil {
					logger.Error().Err(errGen).Str("red_envelope_id", envelope.ID).Msg("Failed to generate random amounts")
					// We continue even if amount generation fails, though this is a critical error
				}
			} else {
				totalClaims := envelope.TotalClaims
				baseAmount := envelope.TotalAmount / totalClaims
				remainder := envelope.TotalAmount % totalClaims

				amounts = make([]int64, totalClaims)
				for i := int64(0); i < totalClaims; i++ {
					if i < remainder {
						amounts[i] = baseAmount + 1
					} else {
						amounts[i] = baseAmount
					}
				}
			}

			if errGen == nil {
				var descriptionStr string
				if envelope.Description != nil {
					descriptionStr = *envelope.Description
				}
				errGen = s.queue.InitializeRedEnvelope(envelope.ID, amounts, descriptionStr, ttl)
				if errGen != nil {
					logger.Error().
						Err(errGen).
						Str("red_envelope_id", envelope.ID).
						Msg("Failed to initialize queue for red envelope")
				} else {
					logger.Info().
						Str("red_envelope_id", envelope.ID).
						Int64("total_claims", envelope.TotalClaims).
						Dur("ttl", ttl).
						Msg("Initialized queue for red envelope")
				}
			}
		}

		// Send socket event for each updated red envelope to the owner
		go SendSocketEvent(envelope.OwnerWallet, constants.RED_ENVELOPE_LIST_REFRESH, map[string]any{
			"red_envelope_id": req.ID,
			"status":          statusRedEnvelope,
			"action":          "updated red envelope status",
		})
	}

	return len(updates), nil
}
