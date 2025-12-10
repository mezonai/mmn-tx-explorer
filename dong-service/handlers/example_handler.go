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

//    TODO: trường bắt buộc phải có là receive_address , các trường còn lại ( ID, type, status, create_at ) thì tự động tạo, còn payload thì nhét hết phần còn lại vào

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
