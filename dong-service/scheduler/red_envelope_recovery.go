package scheduler

import (
	"context"
	"dong-service/logger"
	"dong-service/repository"
)

func RecoverRedEnvelopeExpiry(
	ctx context.Context,
	sched *RedEnvelopeScheduler,
	job *RedEnvelopeExpiryJob,
	repo *repository.RedEnvelopeRepository,
) error {
	logger.Info().Msg("Recovering red envelope expiry schedule from database")

	if err := job.Run(ctx); err != nil {
		logger.Error().
			Err(err).
			Msg("Backlog expiry sweep failed during recovery (continuing to schedule future jobs)")
	}

	envelopes, err := repo.GetActiveExpiringEnvelopes()
	if err != nil {
		return err
	}

	scheduled := 0
	for _, envelope := range envelopes {
		if err := sched.ScheduleExpiry(ctx, envelope.ID, envelope.EndDate); err != nil {
			logger.Error().
				Err(err).
				Str("red_envelope_id", envelope.ID).
				Msg("Failed to schedule expiry job during recovery")
			continue
		}
		scheduled++
	}

	logger.Info().
		Int("found", len(envelopes)).
		Int("scheduled", scheduled).
		Msg("Red envelope expiry recovery completed")
	return nil
}
