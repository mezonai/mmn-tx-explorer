package database

import (
	"context"
	"dong-service/logger"
	"dong-service/types"
	"encoding/json"

	"github.com/redis/go-redis/v9"
)

const DongUpdatesChannel = "dong_updates"

type IndexerSubscriber struct {
	client     *redis.Client
	syncService IndexerSyncProcessor
}

type IndexerSyncProcessor interface {
	ProcessBatch(ctx context.Context, msg *types.DongBatchMessage) error
}

func NewIndexerSubscriber(client *redis.Client, syncService IndexerSyncProcessor) *IndexerSubscriber {
	return &IndexerSubscriber{
		client:      client,
		syncService: syncService,
	}
}

func (s *IndexerSubscriber) Start(ctx context.Context) {
	pubsub := s.client.Subscribe(ctx, DongUpdatesChannel)
	defer pubsub.Close()

	logger.Info().Str("channel", DongUpdatesChannel).Msg("Started listening for indexer updates")

	ch := pubsub.Channel()

	for {
		select {
		case <-ctx.Done():
			logger.Info().Msg("Stopping indexer subscriber...")
			return
		case msg, ok := <-ch:
			if !ok {
				logger.Error().Msg("Redis pubsub channel closed")
				return
			}

			go s.handleMessage(context.Background(), msg.Payload)
		}
	}
}

func (s *IndexerSubscriber) handleMessage(ctx context.Context, payload string) {
	var msg types.DongBatchMessage
	if err := json.Unmarshal([]byte(payload), &msg); err != nil {
		logger.Error().Err(err).Msg("Failed to unmarshal DongBatchMessage from Redis")
		return
	}

	logger.Info().
		Int("offers", len(msg.OfferUpdates)).
		Int("orders", len(msg.OrderUpdates)).
		Int("re_updates", len(msg.RedEnvelopeUpdates)).
		Int("re_claims", len(msg.RedEnvelopeClaimUpdates)).
		Int("contents", len(msg.UserContents)).
		Msg("Received batch updates from Indexer")

	if err := s.syncService.ProcessBatch(ctx, &msg); err != nil {
		logger.Error().Err(err).Msg("Failed to process batch sync message")
	}
}
