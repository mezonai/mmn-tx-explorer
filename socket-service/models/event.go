package models

import "time"


type Event struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	RoomID     string    `json:"room_id"`
	SenderID   string    `json:"sender_id"`
	ReceiverID string    `json:"receiver_id"`
	Type       string    `json:"type"`
	Content    string    `json:"content"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}
