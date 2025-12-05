package handlers

import (
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/services"
	"dong-service/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ExampleHandler struct {
}

// api thật thì mọi người truyền repo vào như các handler khác, ở router khởi tạo instance cũng vật

func NewExampleHandler() *ExampleHandler {
	return &ExampleHandler{}
}

func (h *ExampleHandler) CreateEvents(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		logger.Error().Err(err).Msg("Unauthorized example request attempt")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		logger.Error().Err(err).Msg("Invalid event data")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid event data"))
		return
	}

	receiveID, _ := input["receive_id"].(string)
	eventType := constants.CONFIRM_ORDER
	if t, ok := input["type"].(string); ok {
		eventType = t
	}
	delete(input, "receive_id")
	delete(input, "type")

	payloadBytes, err := json.Marshal(input)
	if err != nil {
		logger.Error().Err(err).Msg("Marshal payload failed")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Marshal payload failed"))
		return
	}

	// trường bắt buộc có receiveID,
	//  Type có thể lấy ở FE hoặc Constant của BE ;
	//  status, createat mặc định ở BE,
	// SenderID thì lấy trong userID từ token
	//  còn lại nhúng hết vào payload json

	event := &models.Event{
		ID:        uuid.New(),
		Type:      eventType,
		Payload:   json.RawMessage(payloadBytes),
		SenderID:  fmt.Sprintf("%v", userID),
		ReceiveID: receiveID,
		Status:    "pending",
		CreateAt:  time.Now(),
	}
	if err := services.Event.SendEvent(event); err != nil {
		logger.Error().Err(err).Msg("Sending event to socket-service failed")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Sending event failed"))
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage(constants.MsgCampaignCreated, event))
}
