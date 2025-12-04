package handlers

import (
	"net/http"
	"socket-service/config"
	"socket-service/logger"
	"socket-service/utils"

	"socket-service/repository"
	"socket-service/service"

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

	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized WebSocket connection attempt")
		conn.WriteMessage(websocket.TextMessage, []byte("Unauthorized: "+err.Error()))
		conn.Close()
		return
	}
	events, err := h.repo.GetListEventByReceiveID(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get events for user")
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to get events: "+err.Error()))
		return
	}
	if len(events) > 0 {
		for _, event := range events {
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Failed to send event to user")
				break
			} else {
				event.Status = "sent"
				if err := h.repo.UpdateEventStatus(event.ID.String(), "sent"); err != nil {
					logger.Error().Err(err).Msg("Failed to update event status after sending via WS")
				}
			}
		}
	}

	h.wsSvc.AddConnection(userID, conn)

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			logger.Info().Msgf("User %s disconnected", userID)
			h.wsSvc.RemoveConnection(userID, conn)
			conn.Close()
			break
		}
	}
}
