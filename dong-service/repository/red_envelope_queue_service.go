package repository

import (
	"context"
	"crypto/rand"
	"dong-service/logger"
	"encoding/hex"
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

func (s *RedEnvelopeQueueService) getClaimTokenKey(redEnvelopeID, walletAddress string) string {
	return fmt.Sprintf("red_envelope:claim_token:%s:%s", redEnvelopeID, walletAddress)
}

func (s *RedEnvelopeQueueService) getClaimTokenDataKey(token string) string {
	return fmt.Sprintf("red_envelope:token_data:%s", token)
}

func (s *RedEnvelopeQueueService) getTotalClaimsKey(redEnvelopeID string) string {
	return fmt.Sprintf("red_envelope:total_claims:%s", redEnvelopeID)
}

// generateClaimToken tạo một token ngẫu nhiên để xác thực claim
func (s *RedEnvelopeQueueService) generateClaimToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *RedEnvelopeQueueService) InitializeRedEnvelope(redEnvelopeID string, totalClaims int64, ttl time.Duration) error {
	if s.redisClient == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	totalClaimsKey := s.getTotalClaimsKey(redEnvelopeID)
	queueCountKey := s.getQueueCountKey(redEnvelopeID)

	pipe := s.redisClient.Pipeline()

	pipe.Set(s.ctx, totalClaimsKey, totalClaims, ttl)

	pipe.Set(s.ctx, queueCountKey, 0, ttl)

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

func (s *RedEnvelopeQueueService) TryEnterQueue(
	redEnvelopeID string,
	walletAddress string,
	userID int64,
	claimAmount int64,
	splitMoneyId int64,
	isRandomDistribution bool,
	tokenTTL time.Duration,
) (string, error) {
	if s.redisClient == nil {
		return "", fmt.Errorf("redis client is not initialized")
	}

	existingTokenKey := s.getClaimTokenKey(redEnvelopeID, walletAddress)
	existingToken, err := s.redisClient.Get(s.ctx, existingTokenKey).Result()
	if err == nil && existingToken != "" {
		logger.Info().
			Str("red_envelope_id", redEnvelopeID).
			Str("wallet", walletAddress).
			Msg("User already has a claim token")
		return existingToken, nil
	}

	totalClaimsKey := s.getTotalClaimsKey(redEnvelopeID)
	queueCountKey := s.getQueueCountKey(redEnvelopeID)

	luaScript := redis.NewScript(`
		local total_claims_key = KEYS[1]
		local queue_count_key = KEYS[2]
		
		local total_claims = tonumber(redis.call('GET', total_claims_key))
		local current_count = tonumber(redis.call('GET', queue_count_key))
		
		if total_claims == nil then
			return {err = "RED_ENVELOPE_NOT_FOUND"}
		end
		
		if current_count >= total_claims then
			return {err = "QUEUE_FULL"}
		end
		
		local new_count = redis.call('INCR', queue_count_key)
		
		if new_count > total_claims then
			redis.call('DECR', queue_count_key)
			return {err = "QUEUE_FULL"}
		end
		
		return {ok = new_count}
	`)

	result, err := luaScript.Run(s.ctx, s.redisClient, []string{totalClaimsKey, queueCountKey}).Result()
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Str("wallet", walletAddress).
			Msg("Failed to execute queue check script")
		return "", fmt.Errorf("failed to check queue: %w", err)
	}

	resultMap, ok := result.(map[interface{}]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected script result format")
	}

	if errMsg, exists := resultMap["err"]; exists {
		errStr := fmt.Sprintf("%v", errMsg)
		if errStr == "QUEUE_FULL" {
			logger.Info().
				Str("red_envelope_id", redEnvelopeID).
				Str("wallet", walletAddress).
				Msg("Queue is full, user cannot enter")
			return "", fmt.Errorf("red envelope is fully claimed")
		}
		if errStr == "RED_ENVELOPE_NOT_FOUND" {
			return "", fmt.Errorf("red envelope not found or expired")
		}
		return "", fmt.Errorf("queue error: %s", errStr)
	}

	claimToken, err := s.generateClaimToken()
	if err != nil {
		s.redisClient.Decr(s.ctx, queueCountKey)
		return "", fmt.Errorf("failed to generate claim token: %w", err)
	}

	tokenData := map[string]interface{}{
		"red_envelope_id":        redEnvelopeID,
		"wallet_address":         walletAddress,
		"user_id":                userID,
		"claim_amount":           claimAmount,
		"split_money_id":         splitMoneyId,
		"is_random_distribution": isRandomDistribution,
		"created_at":             time.Now().Unix(),
	}

	tokenDataKey := s.getClaimTokenDataKey(claimToken)

	pipe := s.redisClient.Pipeline()

	pipe.HSet(s.ctx, tokenDataKey, tokenData)
	pipe.Expire(s.ctx, tokenDataKey, tokenTTL)

	pipe.Set(s.ctx, existingTokenKey, claimToken, tokenTTL)

	_, err = pipe.Exec(s.ctx)
	if err != nil {
		s.redisClient.Decr(s.ctx, queueCountKey)
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Str("wallet", walletAddress).
			Msg("Failed to save claim token")
		return "", fmt.Errorf("failed to save claim token: %w", err)
	}

	logger.Info().
		Str("red_envelope_id", redEnvelopeID).
		Str("wallet", walletAddress).
		Int64("user_id", userID).
		Str("token", claimToken).
		Msg("User entered queue successfully")

	return claimToken, nil
}

func (s *RedEnvelopeQueueService) VerifyClaimToken(token string) (map[string]string, error) {
	if s.redisClient == nil {
		return nil, fmt.Errorf("redis client is not initialized")
	}

	tokenDataKey := s.getClaimTokenDataKey(token)

	tokenData, err := s.redisClient.HGetAll(s.ctx, tokenDataKey).Result()
	if err != nil {
		logger.Error().
			Err(err).
			Str("token", token).
			Msg("Failed to get token data")
		return nil, fmt.Errorf("failed to verify token: %w", err)
	}

	if len(tokenData) == 0 {
		logger.Warn().
			Str("token", token).
			Msg("Token not found or expired")
		return nil, fmt.Errorf("invalid or expired claim token")
	}

	return tokenData, nil
}

func (s *RedEnvelopeQueueService) ReleaseClaimToken(token string, claimSuccessful bool) error {
	if s.redisClient == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	tokenData, err := s.VerifyClaimToken(token)
	if err != nil {
		return nil
	}

	redEnvelopeID := tokenData["red_envelope_id"]
	walletAddress := tokenData["wallet_address"]

	tokenDataKey := s.getClaimTokenDataKey(token)
	tokenMappingKey := s.getClaimTokenKey(redEnvelopeID, walletAddress)

	pipe := s.redisClient.Pipeline()

	pipe.Del(s.ctx, tokenDataKey)

	pipe.Del(s.ctx, tokenMappingKey)

	if !claimSuccessful {
		queueCountKey := s.getQueueCountKey(redEnvelopeID)
		pipe.Decr(s.ctx, queueCountKey)

		logger.Info().
			Str("red_envelope_id", redEnvelopeID).
			Str("wallet", walletAddress).
			Msg("Released queue slot due to failed claim")
	}

	_, err = pipe.Exec(s.ctx)
	if err != nil {
		logger.Error().
			Err(err).
			Str("token", token).
			Msg("Failed to release claim token")
		return fmt.Errorf("failed to release token: %w", err)
	}

	logger.Info().
		Str("red_envelope_id", redEnvelopeID).
		Str("wallet", walletAddress).
		Bool("claim_successful", claimSuccessful).
		Msg("Claim token released")

	return nil
}

func (s *RedEnvelopeQueueService) GetQueueStatus(redEnvelopeID string) (current int64, total int64, err error) {
	if s.redisClient == nil {
		return 0, 0, fmt.Errorf("redis client is not initialized")
	}

	totalClaimsKey := s.getTotalClaimsKey(redEnvelopeID)
	queueCountKey := s.getQueueCountKey(redEnvelopeID)

	pipe := s.redisClient.Pipeline()
	totalCmd := pipe.Get(s.ctx, totalClaimsKey)
	currentCmd := pipe.Get(s.ctx, queueCountKey)

	_, err = pipe.Exec(s.ctx)
	if err != nil && err != redis.Nil {
		return 0, 0, fmt.Errorf("failed to get queue status: %w", err)
	}

	total, _ = totalCmd.Int64()
	current, _ = currentCmd.Int64()

	return current, total, nil
}

func (s *RedEnvelopeQueueService) CleanupExpiredTokens(redEnvelopeID string) (int, error) {
	if s.redisClient == nil {
		return 0, fmt.Errorf("redis client is not initialized")
	}

	pattern := "red_envelope:token_data:*"

	var cursor uint64
	var cleanedCount int

	for {
		var keys []string
		var err error

		keys, cursor, err = s.redisClient.Scan(s.ctx, cursor, pattern, 100).Result()
		if err != nil {
			return cleanedCount, fmt.Errorf("failed to scan tokens: %w", err)
		}

		for _, key := range keys {
			exists, err := s.redisClient.Exists(s.ctx, key).Result()
			if err != nil || exists == 0 {
				continue
			}

			tokenData, err := s.redisClient.HGetAll(s.ctx, key).Result()
			if err != nil || len(tokenData) == 0 {
				continue
			}

			if tokenData["red_envelope_id"] == redEnvelopeID {
				cleanedCount++
			}
		}

		if cursor == 0 {
			break
		}
	}

	logger.Info().
		Str("red_envelope_id", redEnvelopeID).
		Int("cleaned_count", cleanedCount).
		Msg("Cleaned up expired tokens")

	return cleanedCount, nil
}
