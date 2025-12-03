package handlers

import (
	"net/http"
	"socket-service/config"
	"socket-service/logger"
	"socket-service/models"
	"socket-service/repository"
	"socket-service/service"

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


	if conns, ok := h.wsSvc.GetConnections(event.ReceiverID); ok {
		for _, conn := range conns {
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Failed to send event to online user")
			} else {
				logger.Info().Msgf("Event sent to online user %s", event.ReceiverID)
			}
		}
	}


	if err := h.repo.SaveEvent(&event); err != nil {
		logger.Error().Err(err).Msg("Failed to save event")
		c.JSON(http.StatusInternalServerError, "Failed to save event: "+err.Error())
		return
	}
	c.JSON(http.StatusOK, "Event saved successfully")
}
