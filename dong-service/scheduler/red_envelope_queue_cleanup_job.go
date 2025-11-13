package scheduler

import (
	"context"
	"dong-service/logger"
	"dong-service/repository"
	"fmt"
)

type RedEnvelopeQueueCleanupJob struct {
	queueService    *repository.RedEnvelopeQueueService
	redEnvelopeRepo *repository.RedEnvelopeRepository
}

func NewRedEnvelopeQueueCleanupJob(
	queueService *repository.RedEnvelopeQueueService,
	redEnvelopeRepo *repository.RedEnvelopeRepository,
) *RedEnvelopeQueueCleanupJob {
	return &RedEnvelopeQueueCleanupJob{
		queueService:    queueService,
		redEnvelopeRepo: redEnvelopeRepo,
	}
}

func (j *RedEnvelopeQueueCleanupJob) Run(ctx context.Context) error {
	logger.Info().Msg("Starting red envelope queue cleanup job")
	logger.Info().Msg("Red envelope queue cleanup job completed")
	return nil
}

func (j *RedEnvelopeQueueCleanupJob) CleanupExpiredTokensForEnvelope(ctx context.Context, redEnvelopeID string) error {
	cleanedCount, err := j.queueService.CleanupExpiredTokens(redEnvelopeID)
	if err != nil {
		return fmt.Errorf("failed to cleanup tokens for envelope %s: %w", redEnvelopeID, err)
	}

	if cleanedCount > 0 {
		logger.Info().
			Str("red_envelope_id", redEnvelopeID).
			Int("cleaned_count", cleanedCount).
			Msg("Cleaned up expired tokens")
	}

	return nil
}
