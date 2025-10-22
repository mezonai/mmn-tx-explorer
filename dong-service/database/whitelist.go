package database

import (
	"context"
	"log"
	"time"
	"fmt"
	"github.com/redis/go-redis/v9"
	"dong-service/config"
)

var RedisClient *redis.Client
var ctx = context.Background()

func InitRedisWhiteList(cfg *config.RedisConfig) error {

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     cfg.Address,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}
	log.Println("Connected to Redis successfully")
	return nil
}

func Set(tokenID, userID string, ttl time.Duration) error {
	return RedisClient.Set(ctx, tokenID, userID, ttl).Err()
}

func Get(tokenID string) (bool, string, error) {
	userID, err := RedisClient.Get(ctx, tokenID).Result()
	if err == redis.Nil {
		return false, "", nil
	} else if err != nil {
		return false, "", err
	}
	return true, userID, nil
}

func Delete(tokenID string) error {
	return RedisClient.Del(ctx, tokenID).Err()
}