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
