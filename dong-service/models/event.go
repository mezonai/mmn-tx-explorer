package models

import (
	"encoding/json"
	"time"
	"github.com/google/uuid"
)

type Event struct {
	ID        uuid.UUID       `json:"id"`
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
	SenderID  string          `json:"sender_id"`
	ReceiveID string          `json:"receive_id"`
	Status    string          `json:"status"`
	CreateAt  time.Time       `json:"create_at"`
}
