package handlers

import (
	"encoding/json"
	"net/http"
	"socket-service/config"
	"socket-service/logger"
	"socket-service/models"
	"socket-service/repository"
	"socket-service/service"
	"socket-service/utils"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WSHandler struct {
	repo  *repository.EventRepository
	cfg   *config.Config
	wsSvc *service.WSService
}

func NewWSHandler(repo *repository.EventRepository, cfg *config.Config, wsSvc *service.WSService) *WSHandler {
	return &WSHandler{repo: repo, cfg: cfg, wsSvc: wsSvc}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *WSHandler) HandleWS(c *gin.Context) {

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}
	defer conn.Close()
	userAddress, err := utils.GetUserAddressFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized WebSocket connection attempt")
		conn.WriteMessage(websocket.TextMessage, []byte("Unauthorized: "+err.Error()))
		return
	}

	events, err := h.repo.GetListEventByReceiveID(userAddress)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get events for user")
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to get events: "+err.Error()))
		return
	}
	if len(events) > 0 {
		for _, event := range events {
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Failed to send event to user")
				return
			} else {
				event.Status = "sent"
				if err := h.repo.UpdateEventStatus(event.ID.String(), "sent"); err != nil {
					logger.Error().Err(err).Msg("Failed to update event status after sending via WS")
				}
			}
		}
	}

	conn.SetReadDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.PongWait) * time.Second))
	conn.SetPongHandler(func(string) error {
		logger.Info().Msgf("Pong received from user %s", userAddress)
		conn.SetReadDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.PongWait) * time.Second))
		return nil
	})

	h.wsSvc.AddConnection(userAddress, conn)
	defer func() {
		h.wsSvc.RemoveConnection(userAddress, conn)
	}()
	done := make(chan struct{})
	var onceClose sync.Once
	go func() {
		ticker := time.NewTicker(time.Duration(h.cfg.WebSocket.PingPeriod) * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					logger.Error().Err(err).Msg("Ping failed, closing connection")
					onceClose.Do(func() { close(done) })
					return
				} else {
					logger.Info().Msgf("Ping sent to user %s", userAddress)
				}
			case <-done:
				return
			}
		}
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			logger.Info().Msgf("User %s disconnected", userAddress)
			onceClose.Do(func() { close(done) })
			return
		}
	}
}

// HandleWSPublish upgrades connection from backend publisher (API Key protected)
// and accepts event messages (JSON) over the WebSocket. Each message is
// persisted and (if the recipient is online) forwarded to their open
// WebSocket connections.
func (h *WSHandler) HandleWSPublish(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Error().Err(err).Msg("WebSocket upgrade failed for publisher")
		return
	}
	defer conn.Close()

	// read loop for publisher
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			logger.Info().Err(err).Msg("Publisher disconnected or read error")
			return
		}

		var event models.Event
		if err := json.Unmarshal(msg, &event); err != nil {
			logger.Error().Err(err).Msg("Invalid event JSON from publisher")
			conn.WriteMessage(websocket.TextMessage, []byte("invalid_event_json"))
			continue
		}

		// ensure timestamp and status
		if event.CreateAt.IsZero() {
			event.CreateAt = time.Now()
		}
		if event.Status == "" {
			event.Status = "pending"
		}

		sentToOnline := false
		if conns, ok := h.wsSvc.GetConnections(event.ReceiveAddress); ok {
			for _, c := range conns {
				if err := c.WriteJSON(event); err != nil {
					logger.Error().Err(err).Msg("Failed to send event to online user from publisher")
				} else {
					logger.Info().Msgf("Event sent to online user %s (from publisher)", event.ReceiveAddress)
					sentToOnline = true
				}
			}
		}
		if sentToOnline {
			event.Status = "sent"
		}

		if err := h.repo.SaveEvent(&event); err != nil {
			logger.Error().Err(err).Msg("Failed to save event from publisher")
			conn.WriteMessage(websocket.TextMessage, []byte("failed_to_save"))
			continue
		}

		// acknowledge to publisher
		if err := conn.WriteMessage(websocket.TextMessage, []byte("ok")); err != nil {
			logger.Error().Err(err).Msg("Failed to acknowledge publisher")
			return
		}
	}
}
