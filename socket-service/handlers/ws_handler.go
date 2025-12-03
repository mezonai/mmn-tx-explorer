package handlers

import (
	"socket-service/config"
	"socket-service/logger"

	// "socket-service/models"
	"net/http"

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

	userID := c.Query("user_id")
	if userID == "" {
		logger.Error().Msg("Missing user_id in query param")
		conn.WriteMessage(websocket.TextMessage, []byte("Missing user_id"))
		return
	}

	events, err := h.repo.GetListEventByReceiverID(userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get events for user")
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to get events: "+err.Error()))
		return
	}
	for _, event := range events {
		if err := conn.WriteJSON(event); err != nil {
			logger.Error().Err(err).Msg("Failed to send event to user")
			break
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
