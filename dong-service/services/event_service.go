package services

import (
	"bytes"
	"dong-service/logger"
	"dong-service/models"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type EventService struct {
	APIURL string
	APIKey string
}

var Event *EventService

func InitEventService(apiURL, apiKey string) error {
	Event = &EventService{APIURL: apiURL, APIKey: apiKey}
	logger.Info().Str("api_url", apiURL).Msg("Event Service initialized")
	return nil
}

func (s *EventService) SendEvent(event *models.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	client := &http.Client{}
	req, err := http.NewRequest("POST", s.APIURL, bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if s.APIKey != "" {
		req.Header.Set("X-API-Key", s.APIKey)
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("socket-service trả về mã lỗi: %d", resp.StatusCode)
	}
	return nil
}

func SendSocketEvent(receiveAddr string, eventType string, payload map[string]any) {
	p, _ := json.Marshal(payload)

	event := &models.Event{
		ID:             uuid.New(),
		Type:           eventType,
		Payload:        p,
		ReceiveAddress: receiveAddr,
		CreateAt:       time.Now().UTC(),
	}

	if Event == nil {
		return
	}

	if err := Event.SendEvent(event); err != nil {
		logger.Error().Err(err).Msgf("failed to send %s event", eventType)
	}
}
