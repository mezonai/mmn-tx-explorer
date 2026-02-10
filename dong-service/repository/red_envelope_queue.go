package repository

import (
	"context"
	"dong-service/constants"
	"dong-service/logger"
	"fmt"
	"strconv"
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
func (s *RedEnvelopeQueueService) getPoolKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:pool:%s", redEnvelopeID)
}

func (s *RedEnvelopeQueueService) getReservedKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:reserved:%s", redEnvelopeID)
}

func (s *RedEnvelopeQueueService) InitializeRedEnvelope(redEnvelopeID string, amounts []int64, ttl time.Duration) error {
	if s.redisClient == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	poolKey := s.getPoolKey(redEnvelopeID)

	args := make([]interface{}, len(amounts))
	for i, v := range amounts {
		args[i] = v
	}
	pipe := s.redisClient.Pipeline()
	pipe.RPush(s.ctx, poolKey, args...)
	pipe.Expire(s.ctx, poolKey, ttl)

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
		Msg("Red envelope queue initialized successfully")
	return nil
}

var attemptClaimScript = redis.NewScript(`
	local poolKey = KEYS[1]
	local reservedKey = KEYS[2]
	local userID = ARGV[1]

	local reservedAmount = redis.call('HGET', reservedKey, userID)
	if reservedAmount then
		return {reservedAmount, 'ALREADY_QUEUED'}
	end

	local poolExists = redis.call('EXISTS', poolKey)
	if poolExists == 0 then
		local reservedExists = redis.call('EXISTS', reservedKey)
		if reservedExists == 1 then
			return {0, 'LIMIT_REACHED'}
		else
			return {0, 'QUEUE_NOT_INITIALIZE'}
		end
	end

	local amount = redis.call('LPOP', poolKey)
	if not amount then 
		return {0, 'LIMIT_REACHED'}
	end

	redis.call('HSET', reservedKey, userID, amount)
	if redis.call('TTL', reservedKey) == -1 then
		local poolTTL = redis.call('TTL', poolKey)
		if poolTTL > 0 then
			redis.call('EXPIRE', reservedKey, poolTTL)
		end
	end
	return {amount, 'OK'}
`)

func (s *RedEnvelopeQueueService) AttemptClaim(redEnvelopeID string, userID int64) (int, error) {
	if s.redisClient == nil {
		return 0, fmt.Errorf("redis client is not initialized")
	}

	keys := []string{
		s.getPoolKey(redEnvelopeID),
		s.getReservedKey(redEnvelopeID),
	}

	result, err := attemptClaimScript.Run(s.ctx, s.redisClient, keys, userID).Slice()
	if err != nil {
		logger.Error().Err(err).Str("envelope_id", redEnvelopeID).Msg("Failed to run attempt claim script")
		return constants.AmountError, fmt.Errorf("redis script failed")
	}

	amount := fmt.Sprintf("%v", result[0])
	status := fmt.Sprintf("%v", result[1])

	amountInt, err := strconv.Atoi(amount)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to parse amount to int")
		return constants.AmountError, fmt.Errorf("invalid amount data: %w", err)
	}

	switch status {
	case constants.RedEnvelopeQueueStatusLimitReached:
		return amountInt, constants.ErrLimitReached
	case constants.RedEnvelopeQueueStatusNotInitialize:
		return amountInt, constants.ErrQueueNotInit
	default:
		return amountInt, nil
	}
}

func (s *RedEnvelopeQueueService) VerifyReservation(ctx context.Context, redEnvelopeID string, userID int64) (int, error) {
	reservedKey := s.getReservedKey(redEnvelopeID)
	val, err := s.redisClient.HGet(ctx, reservedKey, strconv.FormatInt(userID, 10)).Result()

	if err == redis.Nil {
		return 0, fmt.Errorf("Users are not allowed to receive lucky money.")
	} else if err != nil {
		logger.Error().Err(err).Str("id", redEnvelopeID).Msg("Redis HGet error")
		return 0, err
	}

	amount, err := strconv.Atoi(val)
	if err != nil {
		return 0, fmt.Errorf("invalid amount data in redis")
	}

	return amount, nil
}

func (s *RedEnvelopeQueueService) getClaimedUsersKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:claimed_users:%s", redEnvelopeID)
}

func (s *RedEnvelopeQueueService) getQueueCountKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:queue:count:%s", redEnvelopeID)
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
func (s *RedEnvelopeQueueService) getTotalClaimsKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:total_claims:%s", redEnvelopeID)
}
var attemptClaimScriptLegacy = redis.NewScript(`
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
func (s *RedEnvelopeQueueService) AttemptClaimLegacy(redEnvelopeID string, userID int64) (int, error) {
	if s.redisClient == nil {
		return 0, fmt.Errorf("redis client is not initialized")
	}

	keys := []string{
		s.getClaimedUsersKey(redEnvelopeID),
		s.getQueueCountKey(redEnvelopeID),
		s.getTotalClaimsKey(redEnvelopeID),
	}

	result, err := attemptClaimScriptLegacy.Run(s.ctx, s.redisClient, keys, userID).Result()
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
		return constants.ClaimStatusError, constants.ErrLimitReached
	case constants.RedEnvelopeQueueStatusNotInitialize:
		return constants.ClaimStatusError, constants.ErrQueueNotInit
	default:
		return constants.ClaimStatusError, fmt.Errorf("unknown script result: %s", resultStr)
	}
}