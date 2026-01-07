package handlers

import (
	"net/http"
	"socket-service/config"
	"socket-service/logger"
	"socket-service/models"
	"socket-service/repository"
	"socket-service/service"
	"time"

	"github.com/gin-gonic/gin"
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

	// Broadcast to all users if receive_address is empty
	if event.ReceiveAddress == "" {
		allConns := h.wsSvc.GetAllConnections()
		for _, conn := range allConns {
			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Failed to broadcast event")
			} else {
				sentToOnline = true
			}
		}
		if sentToOnline {
			logger.Info().Msgf("Event broadcasted to %d connections", len(allConns))
			c.JSON(http.StatusOK, "Event broadcasted successfully")
		} else {
			c.JSON(http.StatusOK, "No active connections to broadcast")
		}
		return
	}

	// Send to specific user
	if conns, ok := h.wsSvc.GetConnections(event.ReceiveAddress); ok {
		for _, conn := range conns {
			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Failed to send event to online user")
			} else {
				logger.Info().Msgf("Event sent to online user %s", event.ReceiveAddress)
				sentToOnline = true
			}
		}
	}
	if !sentToOnline {
		if err := h.repo.SaveEvent(&event); err != nil {
			logger.Error().Err(err).Msg("Failed to save event")
			c.JSON(http.StatusInternalServerError, "Failed to save event: "+err.Error())
			return
		}
		c.JSON(http.StatusOK, "Users offline, event saved successfully")
	} else {
		c.JSON(http.StatusOK, "Event sent to online user successfully")
	}

}
