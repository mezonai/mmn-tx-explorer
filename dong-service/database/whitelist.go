package database

import (
	"context"
	"dong-service/config"
	"dong-service/logger"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var ctx = context.Background()

func InitRedisWhiteList(cfg *config.RedisConfig) error {
	logger.Info().
		Str("address", cfg.Address).
		Int("db", cfg.DB).
		Msg("Initializing Redis connection")

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     cfg.Address,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		logger.Error().Err(err).Str("address", cfg.Address).Msg("Failed to connect to Redis")
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logger.Info().Str("address", cfg.Address).Msg("Connected to Redis successfully")
	return nil
}

func Set(tokenID, userID string, ttl time.Duration) error {
	err := RedisClient.Set(ctx, tokenID, userID, ttl).Err()
	if err != nil {
		logger.Error().Err(err).Str("token_id", tokenID).Str("user_id", userID).Msg("Failed to set token in Redis")
	} else {
		logger.Info().Str("token_id", tokenID).Str("user_id", userID).Dur("ttl", ttl).Msg("Token stored in Redis")
	}
	return err
}

func Get(tokenID string) (bool, string, error) {
	userID, err := RedisClient.Get(ctx, tokenID).Result()
	if err == redis.Nil {
		logger.Warn().Str("token_id", tokenID).Msg("Token not found in Redis")
		return false, "", nil
	} else if err != nil {
		logger.Error().Err(err).Str("token_id", tokenID).Msg("Failed to get token from Redis")
		return false, "", err
	}
	logger.Info().Str("token_id", tokenID).Str("user_id", userID).Msg("Token retrieved from Redis")
	return true, userID, nil
}

func Delete(tokenID string) error {
	err := RedisClient.Del(ctx, tokenID).Err()
	if err != nil {
		logger.Error().Err(err).Str("token_id", tokenID).Msg("Failed to delete token from Redis")
	} else {
		logger.Debug().Str("token_id", tokenID).Msg("Token deleted from Redis")
	}
	return err
}
