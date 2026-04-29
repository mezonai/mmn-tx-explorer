package storage

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/rs/zerolog/log"
)

const DongUpdatesChannel = "dong_updates"

type DongBatchMessage struct {
	OfferUpdates             []OfferUpdate              `json:"offer_updates,omitempty"`
	OrderUpdates             []OrderUpdate              `json:"order_updates,omitempty"`
	RedEnvelopeUpdates       []RedEnvelopeUpdate        `json:"red_envelope_updates,omitempty"`
	RedEnvelopeClaimUpdates  []RedEnvelopeClaimUpdate   `json:"red_envelope_claim_updates,omitempty"`
	UserContents             []common.UserContent       `json:"user_contents,omitempty"`
}

type RedEnvelopeClaimUpdate struct {
	ClaimID int64  `json:"claim_id"`
	Status  string `json:"status"`
	TxHash  string `json:"tx_hash"`
}

type OfferUpdate struct {
	OfferID int64  `json:"offer_id"`
	Status  string `json:"status"`
	TxHash  string `json:"tx_hash"`
}

type OrderUpdate struct {
	OfferID int64  `json:"offer_id"`
	OrderID int64  `json:"order_id"`
	Status  string `json:"status"`
	TxHash  string `json:"tx_hash"`
}

type RedEnvelopeUpdate struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	TxHash string `json:"tx_hash"`
}

// PublishDongUpdates sends a batch of updates to the Dong Service via Redis Pub/Sub
func PublishDongUpdates(ctx context.Context, msg *DongBatchMessage) error {
	if RedisClient == nil {
		return nil
	}

	if msg == nil || (len(msg.OfferUpdates) == 0 && len(msg.OrderUpdates) == 0 && 
		len(msg.RedEnvelopeUpdates) == 0 && len(msg.RedEnvelopeClaimUpdates) == 0 && 
		len(msg.UserContents) == 0) {
		return nil
	}

	jsonData, err := json.Marshal(msg)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal DongBatchMessage")
		return err
	}

	err = RedisClient.Publish(ctx, DongUpdatesChannel, jsonData).Err()
	if err != nil {
		log.Error().Err(err).Str("channel", DongUpdatesChannel).Msg("Failed to publish message to Redis")
		return fmt.Errorf("failed to publish to Redis: %w", err)
	}

	log.Debug().
		Int("offer_updates", len(msg.OfferUpdates)).
		Int("order_updates", len(msg.OrderUpdates)).
		Int("red_envelope_updates", len(msg.RedEnvelopeUpdates)).
		Int("user_contents", len(msg.UserContents)).
		Msg("Published batch updates to Redis")

	return nil
}
