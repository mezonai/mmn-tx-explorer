package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Event struct {
	ID        		uuid.UUID       `json:"id"`
	Type      		string          `json:"type"`
	Payload   		json.RawMessage `json:"payload"`
	ReceiveAddress  string          `json:"receive_address"`
	Status    		string          `json:"status"`
	CreateAt  		time.Time       `json:"create_at"`
}