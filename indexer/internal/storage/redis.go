package storage

import (
	"context"
	"fmt"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

var RedisClient *redis.Client

func InitRedis(cfg *config.RedisConfig) error {
	if cfg.Address == "" {
		log.Warn().Msg("Redis address is empty, skipping Redis initialization")
		return nil
	}

	log.Info().
		Str("address", cfg.Address).
		Int("db", cfg.DB).
		Msg("Initializing Redis connection")

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     cfg.Address,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx := context.Background()
	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Error().Err(err).Str("address", cfg.Address).Msg("Failed to connect to Redis")
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Info().Str("address", cfg.Address).Msg("Connected to Redis successfully")
	return nil
}
