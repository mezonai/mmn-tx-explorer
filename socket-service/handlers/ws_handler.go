package handlers

import (
	"encoding/json"
	"net/http"
	"socket-service/config"
	"socket-service/constant"
	"socket-service/logger"
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

const (
	joinRoom   = "join_room"
	joinedRoom = "joined_room:"
	leaveRoom  = "leave_room"
	leftRoom   = "left_room:"
)

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

	events, err := h.repo.GetListEventByReceiver(userAddress)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get events for user")
		conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to get events: "+err.Error()))
		return
	}

	if len(events) > 0 {
		for _, event := range events {
			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
			if err := conn.WriteJSON(event); err != nil {
				logger.Error().Err(err).Msg("Failed to send event to user")
				return
			} else {
				logger.Info().Msgf("Event sent to user %s: %s", userAddress, event.ID)
				if err := h.repo.DeleteEvent(event.ID.String()); err != nil {
					logger.Error().Err(err).Msgf("Failed to delete event %s after sending to user %s", event.ID, userAddress)
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
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			logger.Info().Msgf("User %s disconnected", userAddress)
			onceClose.Do(func() { close(done) })
			return
		}
		if messageType == websocket.TextMessage {
			// Heartbeat
			if string(message) == constant.HeartbeatCheck {
				logger.Info().Msgf("Heartbeat check received from user %s", userAddress)
				conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
				conn.WriteMessage(websocket.TextMessage, []byte(constant.HeartbeatAck))
				logger.Info().Msgf("Heartbeat ack sent to user %s", userAddress)
				continue
			}
			// Handle join_room/leave_room
			type RoomMsg struct {
				Type string `json:"type"`
				Room string `json:"room"`
			}
			var rm RoomMsg
			if err := json.Unmarshal(message, &rm); err != nil {
				logger.Error().Err(err).Msg("Failed to unmarshal room message")
				return
			}

			if rm.Type != joinRoom && rm.Type != leaveRoom {
				logger.Error().Msgf("Invalid room message type: %s", rm.Type)
				return
			}

			if !h.ValidateRoom(rm.Room) {
				conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))
				_ = conn.WriteMessage(
					websocket.TextMessage,
					[]byte("Invalid room: "+rm.Room),
				)
				continue
			}

			conn.SetWriteDeadline(time.Now().Add(time.Duration(h.cfg.WebSocket.WriteWait) * time.Second))

			switch rm.Type {
			case joinRoom:
				logger.Info().Msgf("[BE] FE %s %s %s", userAddress, joinRoom, rm.Room)
				h.wsSvc.AddConnectionToRoom(rm.Room, conn)
				_ = conn.WriteMessage(
					websocket.TextMessage,
					[]byte(joinedRoom+rm.Room),
				)

			case leaveRoom:
				logger.Info().Msgf("[BE] FE %s %s %s", userAddress, leaveRoom, rm.Room)
				h.wsSvc.RemoveConnectionFromRoom(rm.Room, conn)
				_ = conn.WriteMessage(
					websocket.TextMessage,
					[]byte(leftRoom+rm.Room),
				)
			}
		}
	}
}

func (h *WSHandler) ValidateRoom(room string) bool {
	allowedRooms := map[string]bool{
		constant.OFFER_ROOM:        true,
		constant.RED_ENVELOPE_ROOM: true,
	}

	if _, ok := allowedRooms[room]; ok {
		return true
	}

	logger.Warn().Msgf("Invalid room: %s", room)
	return false
}
