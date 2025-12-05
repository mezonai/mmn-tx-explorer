package handlers

import (
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/services"
	"encoding/json"
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

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		logger.Error().Err(err).Msg("Invalid event data")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid event data"))
		return
	}

	receiveAddress, _ := input["receive_address"].(string)
	eventType := constants.CONFIRM_ORDER
	if t, ok := input["type"].(string); ok {
		eventType = t
	}
	delete(input, "receive_address")
	delete(input, "type")

	payloadBytes, err := json.Marshal(input)
	if err != nil {
		logger.Error().Err(err).Msg("Marshal payload failed")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Marshal payload failed"))
		return
	}

	// trường bắt buộc có receiveAddress,
	//  Type có thể lấy ở FE hoặc Constant của BE ;
	//  status, createat mặc định ở BE,
	//  còn lại nhúng hết vào payload json

	event := &models.Event{
		ID:        uuid.New(),
		Type:      eventType,
		Payload:   json.RawMessage(payloadBytes),
		ReceiveAddress: receiveAddress,
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
