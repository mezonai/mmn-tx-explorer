package storage

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var ctx = context.Background()

func init() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: "",
		DB:       0,
	})

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Connected to Redis successfully")
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
