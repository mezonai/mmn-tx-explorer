package scheduler

import (
	"context"
	"dong-service/logger"
	"fmt"
	"sync"
	"time"

	"github.com/go-co-op/gocron/v2"
	"github.com/google/uuid"
)

type EnvelopeExpiryHandler func(ctx context.Context, envelopeID string) error

type RedEnvelopeScheduler struct {
	sched   gocron.Scheduler
	handler EnvelopeExpiryHandler
	rootCtx context.Context

	mu   sync.Mutex
	jobs map[string]uuid.UUID
}

func NewRedEnvelopeScheduler(rootCtx context.Context, handler EnvelopeExpiryHandler) (*RedEnvelopeScheduler, error) {
	if handler == nil {
		return nil, fmt.Errorf("handler must not be nil")
	}
	if rootCtx == nil {
		rootCtx = context.Background()
	}
	s, err := gocron.NewScheduler(gocron.WithLocation(time.Local))
	if err != nil {
		return nil, fmt.Errorf("failed to create gocron scheduler: %w", err)
	}
	return &RedEnvelopeScheduler{
		sched:   s,
		handler: handler,
		rootCtx: rootCtx,
		jobs:    make(map[string]uuid.UUID),
	}, nil
}

func (r *RedEnvelopeScheduler) Start() {
	r.sched.Start()
	logger.Info().Msg("Red envelope gocron scheduler started")
}

func (r *RedEnvelopeScheduler) Shutdown() error {
	logger.Info().Msg("Shutting down red envelope gocron scheduler")
	return r.sched.Shutdown()
}

func (r *RedEnvelopeScheduler) ScheduleExpiry(ctx context.Context, envelopeID string, expireAt time.Time) error {
	if envelopeID == "" {
		return fmt.Errorf("envelopeID is empty")
	}

	if !expireAt.After(time.Now()) {
		logger.Warn().
			Str("envelope_id", envelopeID).
			Time("expire_at", expireAt).
			Msg("Envelope already past expiry; running expiry handler immediately")
		go r.executeExpiry(r.rootCtx, envelopeID)
		_ = ctx
		return nil
	}

	r.mu.Lock()
	if existingID, ok := r.jobs[envelopeID]; ok {
		if err := r.sched.RemoveJob(existingID); err != nil {
			logger.Warn().
				Err(err).
				Str("envelope_id", envelopeID).
				Msg("Failed to remove existing expiry job (continuing with replacement)")
		}
		delete(r.jobs, envelopeID)
	}
	r.mu.Unlock()

	job, err := r.sched.NewJob(
		gocron.OneTimeJob(gocron.OneTimeJobStartDateTime(expireAt)),
		gocron.NewTask(func() {
			r.executeExpiry(r.rootCtx, envelopeID)
		}),
		gocron.WithName(fmt.Sprintf("red_envelope_expiry:%s", envelopeID)),
	)
	if err != nil {
		return fmt.Errorf("failed to schedule expiry job for %s: %w", envelopeID, err)
	}

	r.mu.Lock()
	r.jobs[envelopeID] = job.ID()
	r.mu.Unlock()

	logger.Info().
		Str("envelope_id", envelopeID).
		Time("expire_at", expireAt).
		Dur("in", time.Until(expireAt)).
		Msg("Scheduled red envelope expiry job")
	return nil
}

func (r *RedEnvelopeScheduler) CancelExpiry(envelopeID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	jobID, ok := r.jobs[envelopeID]
	if !ok {
		return
	}
	if err := r.sched.RemoveJob(jobID); err != nil {
		logger.Warn().
			Err(err).
			Str("envelope_id", envelopeID).
			Msg("Failed to cancel red envelope expiry job")
		return
	}
	delete(r.jobs, envelopeID)
	logger.Info().Str("envelope_id", envelopeID).Msg("Cancelled red envelope expiry job")
}

func (r *RedEnvelopeScheduler) JobCount() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.jobs)
}

func (r *RedEnvelopeScheduler) executeExpiry(ctx context.Context, envelopeID string) {
	logger.Info().Str("envelope_id", envelopeID).Msg("Running scheduled red envelope expiry")

	if err := r.handler(ctx, envelopeID); err != nil {
		logger.Error().
			Err(err).
			Str("envelope_id", envelopeID).
			Msg("Scheduled expiry handler failed")
	}

	r.mu.Lock()
	delete(r.jobs, envelopeID)
	r.mu.Unlock()
}
