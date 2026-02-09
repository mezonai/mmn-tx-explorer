package handlers

import (
	"net/http"
	"socket-service/config"
	"socket-service/constant"
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
		c.JSON(http.StatusOK, "Users offline, event saved")
		return
	}

	c.JSON(http.StatusOK, "Event sent successfully")
}
