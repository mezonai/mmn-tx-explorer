package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// SocketEvent represents the event payload expected by socket-service
type SocketEvent struct {
	ID             uuid.UUID       `json:"id"`
	Type           string          `json:"type"`
	Payload        json.RawMessage `json:"payload"`
	Status         string          `json:"status,omitempty"`
	ReceiveAddress string          `json:"receive_address"`
	CreateAt       time.Time       `json:"create_at"`
}

const (
	OFFER_LIST_REFRESH        = "OFFER_LIST_REFRESH"
	OFFER_ROOM                = "offer_updates"
	RED_ENVELOPE_LIST_REFRESH = "RED_ENVELOPE_LIST_REFRESH"
	RED_ENVELOPE_ROOM         = "red_envelope_updates"
)

type EventService struct {
	APIURL string
	APIKey string
	client *http.Client
}

var Event *EventService

func InitEventService(apiURL, apiKey string) error {
	if apiURL == "" {
		return fmt.Errorf("apiURL must not be empty")
	}
	Event = &EventService{APIURL: apiURL, APIKey: apiKey, client: &http.Client{Timeout: 10 * time.Second}}
	return nil
}

func (s *EventService) SendEvent(ev *SocketEvent) error {
	if s == nil {
		return fmt.Errorf("event service not initialized")
	}
	data, err := json.Marshal(ev)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", s.APIURL, bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if s.APIKey != "" {
		req.Header.Set("X-API-Key", s.APIKey)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("socket-service returned status: %d", resp.StatusCode)
	}
	return nil
}

func SendSocketEventDirect(receiveAddr, eventType string, payload interface{}) error {
	if Event == nil {
		return fmt.Errorf("event service not initialized")
	}

	var payloadBytes []byte
	switch v := payload.(type) {
	case nil:
		payloadBytes = []byte("null")
	case json.RawMessage:
		payloadBytes = v
	case []byte:
		payloadBytes = v
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return fmt.Errorf("failed to marshal payload: %w", err)
		}
		payloadBytes = b
	}

	ev := &SocketEvent{
		ID:             uuid.New(),
		Type:           eventType,
		Payload:        json.RawMessage(payloadBytes),
		Status:         "PENDING",
		ReceiveAddress: receiveAddr,
		CreateAt:       time.Now().UTC(),
	}

	return Event.SendEvent(ev)
}
