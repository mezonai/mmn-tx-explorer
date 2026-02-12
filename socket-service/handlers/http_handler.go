package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"socket-service/config"
	"socket-service/logger"
	"socket-service/models"
	"socket-service/repository"
	"socket-service/service"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type HTTPHandler struct {
	repo  *repository.EventRepository
	cfg   *config.Config
	wsSvc *service.WSService
}

func NewHTTPHandler(repo *repository.EventRepository, cfg *config.Config, wsSvc *service.WSService) *HTTPHandler {
	return &HTTPHandler{repo: repo, cfg: cfg, wsSvc: wsSvc}
}

func (h *HTTPHandler) SaveEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		logger.Error().Err(err).Msg("Failed to bind event JSON")
		c.JSON(http.StatusBadRequest, "Invalid event data: "+err.Error())
		return
	}

	sentToOnline := false

	sentMap := make(map[*websocket.Conn]struct{})

	if conns, ok := h.wsSvc.GetConnections(event.ReceiveAddress); ok {
		for _, conn := range conns {
			if _, sent := sentMap[conn]; sent {
				continue
			}
			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Send to user failed")
			} else {
				sentToOnline = true
				sentMap[conn] = struct{}{}
			}
		}
	}

	if roomConns, ok := h.wsSvc.GetRoomConnections(event.ReceiveAddress); ok {
		for _, conn := range roomConns {
			if _, sent := sentMap[conn]; sent {
				continue
			}
			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Send to room failed")
			} else {
				sentToOnline = true
				sentMap[conn] = struct{}{}
			}
		}
	}

	if !sentToOnline {
		if err := h.repo.SaveEvent(&event); err != nil {
			logger.Error().Err(err).Msg("Failed to save event")
			c.JSON(http.StatusInternalServerError, "Failed to save event: "+err.Error())
			return
		}
		logger.Info().Str("event_id", event.ID.String()).Msg("Event saved for offline users")
	}

	var payloadMap map[string]interface{}
	if err := json.Unmarshal(event.Payload, &payloadMap); err == nil {
		if redEnvelopeID, ok := payloadMap["red_envelope_id"].(string); ok && redEnvelopeID != "" {

			forwardEvent := event
			forwardEvent.ReceiveAddress = "dong-service"
			
			if err := h.forwardToDongService(&forwardEvent); err != nil {
				logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("Failed to forward event to Service B")
				// Don't fail the request, just log the error
			} else {
				logger.Info().Str("event_id", event.ID.String()).Str("red_envelope_id", redEnvelopeID).Msg("Event forwarded to Service B")
			}
		}
	}

	c.JSON(http.StatusOK, "Event sent successfully")
}

// InternalEvent handles events from indexer
// It broadcasts via WebSocket and forwards to dong-service if ReceiveAddress is "dong-service"
func (h *HTTPHandler) InternalEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		logger.Error().Err(err).Msg("Failed to bind event JSON")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event data: " + err.Error()})
		return
	}

	logger.Info().
		Str("event_id", event.ID.String()).
		Str("event_type", event.Type).
		Str("receive_address", event.ReceiveAddress).
		Msg("Received internal event")

	sentToOnline := false
	sentMap := make(map[*websocket.Conn]struct{})

	if conns, ok := h.wsSvc.GetConnections(event.ReceiveAddress); ok {
		for _, conn := range conns {
			if _, sent := sentMap[conn]; sent {
				continue
			}
			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Send to user failed")
			} else {
				sentToOnline = true
				sentMap[conn] = struct{}{}
				logger.Info().Str("event_id", event.ID.String()).Msg("Event sent to WebSocket connection")
			}
		}
	}

	if roomConns, ok := h.wsSvc.GetRoomConnections(event.ReceiveAddress); ok {
		for _, conn := range roomConns {
			if _, sent := sentMap[conn]; sent {
				continue
			}
			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Send to room failed")
			} else {
				sentToOnline = true
				sentMap[conn] = struct{}{}
				logger.Info().Str("event_id", event.ID.String()).Msg("Event sent to WebSocket room")
			}
		}
	}

	if !sentToOnline {
		if err := h.repo.SaveEvent(&event); err != nil {
			logger.Error().Err(err).Msg("Failed to save event")
		} else {
			logger.Info().Str("event_id", event.ID.String()).Msg("Event saved for offline users")
		}
	}

	if event.ReceiveAddress == "dong-service" {
		if err := h.forwardToDongService(&event); err != nil {
			logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("Failed to forward event to Service B")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Event broadcasted but failed to forward to Service B",
				"details": err.Error(),
			})
			return
		}
		logger.Info().Str("event_id", event.ID.String()).Msg("Event forwarded to Service B")
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Event processed successfully",
		"event_id":     event.ID.String(),
		"broadcasted":  sentToOnline,
		"forwarded":    event.ReceiveAddress == "dong-service",
	})
}

// forwardToDongService forwards the event to dong-service via HTTP POST
func (h *HTTPHandler) forwardToDongService(event *models.Event) error {
	// Use standard net/http for forwarding
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Marshal event to JSON
	eventJSON, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}
	url := h.cfg.Services.DongServiceURL
	// Create request to Service B
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(eventJSON))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	// Note: API key forwarding would need to be passed as parameter
	// For now, Service B should have its own authentication

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to Service B: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Service B returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}