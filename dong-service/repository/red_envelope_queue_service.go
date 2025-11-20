package repository

import (
	"context"
	"dong-service/logger"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedEnvelopeQueueService struct {
	redisClient *redis.Client
	ctx         context.Context
}

func NewRedEnvelopeQueueService(redisClient *redis.Client) *RedEnvelopeQueueService {
	return &RedEnvelopeQueueService{
		redisClient: redisClient,
		ctx:         context.Background(),
	}
}

// Redis key generators
func (s *RedEnvelopeQueueService) getQueueCountKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:queue:count:%s", redEnvelopeID)
}

func (s *RedEnvelopeQueueService) getTotalClaimsKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:total_claims:%s", redEnvelopeID)
}

func (s *RedEnvelopeQueueService) InitializeRedEnvelope(redEnvelopeID string, totalClaims int64, ttl time.Duration) error {
	if s.redisClient == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	totalClaimsKey := s.getTotalClaimsKey(redEnvelopeID)
	queueCountKey := s.getQueueCountKey(redEnvelopeID)
	claimedUsersKey := s.getClaimedUsersKey(redEnvelopeID)

	pipe := s.redisClient.Pipeline()

	pipe.Set(s.ctx, totalClaimsKey, totalClaims, ttl)
	pipe.Set(s.ctx, queueCountKey, 0, ttl)
	pipe.Expire(s.ctx, claimedUsersKey, ttl)

	_, err := pipe.Exec(s.ctx)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Msg("Failed to initialize red envelope queue")
		return fmt.Errorf("failed to initialize queue: %w", err)
	}

	logger.Info().
		Str("red_envelope_id", redEnvelopeID).
		Int64("total_claims", totalClaims).
		Msg("Red envelope queue initialized successfully")

	return nil
}

func (s *RedEnvelopeQueueService) getClaimedUsersKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:claimed_users:%s", redEnvelopeID)
}
