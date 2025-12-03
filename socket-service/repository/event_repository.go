package repository

import (
	"context"
	"database/sql"
	"socket-service/models"
	"fmt"
)

type EventRepository struct {
	db               *sql.DB
    eventSchema 	 string
}

func NewEventRepository(db *sql.DB, eventSchema string) *EventRepository {
	return &EventRepository{
		db: db,
        eventSchema: eventSchema,
	}
}

func (r *EventRepository) GetListEventByReceiverID(userID string) ([]models.Event, error) {
	query := `SELECT id, room_id, sender_id, receiver_id, type, content, status, created_at FROM events WHERE receiver_id = $1 AND status = 'pending'`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var events []models.Event
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(&event.ID, &event.RoomID, &event.SenderID, &event.ReceiverID, &event.Type, &event.Content, &event.Status, &event.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, nil
}


func (r *EventRepository) SaveEvent(event *models.Event) error {
	query := fmt.Sprintf("INSERT INTO %s.events (room_id, sender_id, receiver_id, type, content, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)", r.eventSchema)
	_, err := r.db.ExecContext(context.Background(), query, event.RoomID, event.SenderID, event.ReceiverID, event.Type, event.Content, event.Status, event.CreatedAt)
	return err
}