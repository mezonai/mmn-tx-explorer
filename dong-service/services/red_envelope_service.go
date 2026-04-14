package services

import (
	"context"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
)

type RedEnvelopeService struct {
	repo *repository.RedEnvelopeRepository
}

func NewRedEnvelopeService(repo *repository.RedEnvelopeRepository) *RedEnvelopeService {
	return &RedEnvelopeService{
		repo: repo,
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

		ownerWallet, err := s.repo.UpdateStatusInternal(ctx, req.ID, statusRedEnvelope, req.TransactionHash)
		if err != nil {
			logger.Error().Err(err).Str("envelope_id", req.ID).Msg("Failed to update red envelope status internally")
			// We continue for others even if one fails in batch
			continue
		}

		// Send socket event for each updated red envelope to the owner
		go SendSocketEvent(ownerWallet, constants.RED_ENVELOPE_LIST_REFRESH, map[string]any{
			"red_envelope_id": req.ID,
			"status":          statusRedEnvelope,
			"action":          "updated red envelope status",
		})
	}

	return len(updates), nil
}
