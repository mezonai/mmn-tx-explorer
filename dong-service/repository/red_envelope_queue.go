package repository

import (
	"context"
	"dong-service/constants"
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

var attemptClaimScript = redis.NewScript(`
	local totalClaims = tonumber(redis.call('GET', KEYS[3]))
	if not totalClaims or totalClaims == 0 then
			return 'QUEUE_NOT_INITIALIZE'
	end

	local isMember = redis.call('SISMEMBER', KEYS[1], ARGV[1])
	if isMember == 1 then
			return 'ALREADY_QUEUED'
	end

	local currentCount = tonumber(redis.call('GET', KEYS[2])) or 0
	if currentCount >= totalClaims then
			return 'LIMIT_REACHED'
	end

	redis.call('SADD', KEYS[1], ARGV[1])
	local newCount = redis.call('INCR', KEYS[2])

	return 'OK'
`)

func (s *RedEnvelopeQueueService) AttemptClaim(redEnvelopeID string, userID int64) (int, error) {
	if s.redisClient == nil {
		return 0, fmt.Errorf("redis client is not initialized")
	}

	keys := []string{
		s.getClaimedUsersKey(redEnvelopeID),
		s.getQueueCountKey(redEnvelopeID),
		s.getTotalClaimsKey(redEnvelopeID),
	}

	result, err := attemptClaimScript.Run(s.ctx, s.redisClient, keys, userID).Result()
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", redEnvelopeID).Msg("Failed to run attempt claim script")
		return constants.ClaimStatusError, fmt.Errorf("redis script failed: %w", err)
	}
	switch resultStr := result.(string); resultStr {
	case constants.RedEnvelopeStatusOk:
		return constants.ClaimStatusSuccess, nil
	case constants.RedEnvelopeQueueStatusUserAlreadyInQueue:
		return constants.ClaimStatusAlreadyQueued, nil
	case constants.RedEnvelopeQueueStatusLimitReached:
		return constants.ClaimStatusError, fmt.Errorf("red envelope claims limit reached")
	case constants.RedEnvelopeQueueStatusNotInitialize:
		return constants.ClaimStatusError, fmt.Errorf("queue not initialized or expired")
	default:
		return constants.ClaimStatusError, fmt.Errorf("unknown script result: %s", resultStr)
	}
}

func (s *RedEnvelopeQueueService) RollbackClaim(redEnvelopeID string, userID int64) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pipe := s.redisClient.Pipeline()
	pipe.SRem(ctx, s.getClaimedUsersKey(redEnvelopeID), userID)
	pipe.Decr(ctx, s.getQueueCountKey(redEnvelopeID))

	_, err := pipe.Exec(ctx)
	if err != nil {
		logger.Error().Err(err).
			Str("envelope_id", redEnvelopeID).
			Int64("user_id", userID).
			Msg("CRITICAL: Failed to rollback redis claim")
	}
}
