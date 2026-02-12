package handlers

import (
	"context"
	"dong-service/blockchain"
	"dong-service/config"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/repository"
	"dong-service/types"
	"dong-service/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EventData struct {
	Action          string `json:"action"`
	RedEnvelopeID   string `json:"red_envelope_id,omitempty"`
	Status          string `json:"status,omitempty"`
	TransactionHash string `json:"transaction_hash,omitempty"`
}

type EventHandler struct {
	cfg             *config.Config
	blockchainService *blockchain.BlockchainService
	walletRepo      *repository.IntermediaryWalletRepository
	queueService    *repository.RedEnvelopeQueueService
}

func NewEventHandler(cfg *config.Config, blockchainService *blockchain.BlockchainService, walletRepo *repository.IntermediaryWalletRepository, queueService *repository.RedEnvelopeQueueService) *EventHandler {
	return &EventHandler{
		cfg:              cfg,
		blockchainService: blockchainService,
		walletRepo:       walletRepo,
		queueService:     queueService,
	}
}

// ReceiveEvent handles events from Service C (socket-service)
// @Summary Receive event from socket-service
// @Description Receives event, saves to Redis, and validates in DB
// @Tags events
// @Accept json
// @Produce json
// @Param event body models.Event true "Event data"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/receive [post]
func (h *EventHandler) ReceiveEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		logger.Error().Err(err).Msg("Failed to bind event JSON")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid event data: "+err.Error()))
		return
	}

	logger.Info().
		Str("event_id", event.ID.String()).
		Str("event_type", event.Type).
		Str("receive_address", event.ReceiveAddress).
		Msg("Received event from Service C")

	// Unmarshal Payload into EventData struct
	var eventData EventData
	if err := json.Unmarshal(event.Payload, &eventData); err != nil {
		logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("Failed to unmarshal event payload")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid event payload: "+err.Error()))
		return
	}

	logger.Info().
		Str("event_id", event.ID.String()).
		Str("action", eventData.Action).
		Str("red_envelope_id", eventData.RedEnvelopeID).
		Msg("Event payload unmarshaled")

	// Save to Redis
	ctx := context.Background()
	redisKey := fmt.Sprintf("event:%s", event.ID.String())
	
	// Store the entire event as JSON in Redis with TTL of 24 hours
	eventJSON, err := json.Marshal(event)
	if err != nil {
		logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("Failed to marshal event for Redis")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to process event"))
		return
	}

	ttl := 24 * time.Hour
	if err := database.RedisClient.Set(ctx, redisKey, eventJSON, ttl).Err(); err != nil {
		logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("Failed to save event to Redis")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to save event to Redis"))
		return
	}

	logger.Info().
		Str("event_id", event.ID.String()).
		Str("redis_key", redisKey).
		Dur("ttl", ttl).
		Msg("Event saved to Redis")

	if eventData.RedEnvelopeID != "" {
		if err := h.validateRedEnvelopeInDB(eventData.RedEnvelopeID); err != nil {
			logger.Error().Err(err).
				Str("event_id", event.ID.String()).
				Str("red_envelope_id", eventData.RedEnvelopeID).
				Msg("Failed to validate red envelope in DB")
		} else {
			logger.Info().
				Str("event_id", event.ID.String()).
				Str("red_envelope_id", eventData.RedEnvelopeID).
				Msg("Red envelope validated in DB")
		}
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Event received and processed successfully", map[string]interface{}{
		"event_id":        event.ID.String(),
		"event_type":      event.Type,
		"action":          eventData.Action,
		"redis_key":       redisKey,
		"db_validated":    eventData.RedEnvelopeID != "",
	}))
}

func (h *EventHandler) validateRedEnvelopeInDB(redEnvelopeID string) error {
	id, err := uuid.Parse(redEnvelopeID)
	if err != nil {
		return fmt.Errorf("invalid red envelope ID format: %w", err)
	}

	query := fmt.Sprintf(`
		SELECT id, status, red_envelope_wallet, owner_wallet, total_amount, total_claims, end_date, is_random_distribution, min_amount, max_amount
		FROM %s.red_envelope 
		WHERE id = $1
	`, h.cfg.Database.Schema)

	var envelope struct {
		ID                   uuid.UUID
		Status               string
		RedEnvelopeWallet    string
		OwnerWallet          string
		TotalAmount          int64
		TotalClaims          int64
		EndDate              *time.Time
		IsRandomDistribution bool
		MinAmount            *int64
		MaxAmount            *int64
	}

	err = database.GetDB().QueryRow(query, id).Scan(
		&envelope.ID,
		&envelope.Status,
		&envelope.RedEnvelopeWallet,
		&envelope.OwnerWallet,
		&envelope.TotalAmount,
		&envelope.TotalClaims,
		&envelope.EndDate,
		&envelope.IsRandomDistribution,
		&envelope.MinAmount,
		&envelope.MaxAmount,
	)
	if err != nil {
		return fmt.Errorf("red envelope not found in database: %w", err)
	}

	logger.Info().
		Str("red_envelope_id", redEnvelopeID).
		Str("status", envelope.Status).
		Msg("Red envelope found in database")

	ctx := context.Background()

	// Handle FAILED status: transfer money back to owner
	if envelope.Status == constants.RedEnvelopeStatusFailed {
		if h.blockchainService == nil || h.walletRepo == nil {
			logger.Warn().
				Str("red_envelope_id", redEnvelopeID).
				Msg("Blockchain service or wallet repo not available, skipping transfer for FAILED status")
			return nil
		}

		wallet, err := h.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).
				Str("red_envelope_id", redEnvelopeID).
				Msg("Failed to get wallet for FAILED red envelope")
			return fmt.Errorf("failed to get wallet: %w", err)
		}

		amount := types.NewBigIntString(envelope.TotalAmount).Multiply(constants.TokenMultiplierBigIntString)
		_, err = h.blockchainService.TransferMoney(
			wallet.EncryptedPrivateKey,
			envelope.RedEnvelopeWallet,
			envelope.OwnerWallet,
			amount.String(),
			constants.TextDataLuckyMoney,
			constants.ExtraInfoLuckyMoney,
		)
		if err != nil {
			logger.Error().Err(err).
				Str("red_envelope_id", redEnvelopeID).
				Msg("Failed to transfer money to owner wallet for FAILED red envelope")
			return fmt.Errorf("failed to transfer money to owner wallet: %w", err)
		}

		logger.Info().
			Str("red_envelope_id", redEnvelopeID).
			Str("from", envelope.RedEnvelopeWallet).
			Str("to", envelope.OwnerWallet).
			Msg("Transferred money back to owner for FAILED red envelope")
	}

	// Handle PUBLISHED status: initialize Redis queues
	if envelope.Status == constants.RedEnvelopeStatusPublished && h.queueService != nil {
		ttl := 2 * 24 * time.Hour
		if envelope.EndDate != nil {
			ttl = time.Until(*envelope.EndDate)
			if ttl < 0 {
				ttl = 24 * time.Hour
			}
		}

		// Initialize legacy queue
		if err := h.queueService.InitializeLegacyQueue(redEnvelopeID, envelope.TotalClaims, ttl); err != nil {
			logger.Error().
				Err(err).
				Str("red_envelope_id", redEnvelopeID).
				Msg("Failed to initialize legacy queue for red envelope")
		} else {
			logger.Info().
				Str("red_envelope_id", redEnvelopeID).
				Int64("total_claims", envelope.TotalClaims).
				Dur("ttl", ttl).
				Msg("Initialized legacy queue for red envelope")
		}

		// Generate amounts
		var amounts []int64
		if envelope.IsRandomDistribution && envelope.MinAmount != nil && envelope.MaxAmount != nil {
			amounts, err = utils.GenerateRandomAmounts(envelope.TotalAmount, *envelope.MinAmount, *envelope.MaxAmount, int(envelope.TotalClaims))
			if err != nil {
				logger.Error().Err(err).
					Str("red_envelope_id", redEnvelopeID).
					Msg("Failed to generate random amounts")
				return fmt.Errorf("failed to generate random amounts: %w", err)
			}
		} else {
			totalClaims := envelope.TotalClaims
			baseAmount := envelope.TotalAmount / totalClaims
			remainder := envelope.TotalAmount % totalClaims

			amounts = make([]int64, totalClaims)
			for i := int64(0); i < totalClaims; i++ {
				if i < remainder {
					amounts[i] = baseAmount + 1
				} else {
					amounts[i] = baseAmount
				}
			}
		}

		// Initialize red envelope queue
		err = h.queueService.InitializeRedEnvelope(redEnvelopeID, amounts, ttl)
		if err != nil {
			logger.Error().
				Err(err).
				Str("red_envelope_id", redEnvelopeID).
				Msg("Failed to initialize queue for red envelope")
		} else {
			logger.Info().
				Str("red_envelope_id", redEnvelopeID).
				Int64("total_claims", envelope.TotalClaims).
				Dur("ttl", ttl).
				Msg("Initialized queue for red envelope")
		}
	}

	return nil
}
