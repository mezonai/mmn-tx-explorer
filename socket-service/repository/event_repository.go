package repository

import (
	"context"
	"database/sql"
	"fmt"
	"socket-service/models"
)

type EventRepository struct {
	db          *sql.DB
	eventSchema string
}

func NewEventRepository(db *sql.DB, eventSchema string) *EventRepository {
	return &EventRepository{
		db:          db,
		eventSchema: eventSchema,
	}
}

func (r *EventRepository) GetListEventByReceiveID(userID string) ([]models.Event, error) {
	query := `SELECT id, type, payload, sender_id, receive_id, status, create_at FROM events WHERE receive_id = $1 AND status = 'pending'`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var events []models.Event
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(&event.ID, &event.Type, &event.Payload, &event.SenderID, &event.ReceiveID, &event.Status, &event.CreateAt); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, nil
}

func (r *EventRepository) SaveEvent(event *models.Event) error {
	query := fmt.Sprintf("INSERT INTO %s.events (id, type, payload, sender_id, receive_id, status, create_at) VALUES ($1, $2, $3, $4, $5, $6, $7)", r.eventSchema)
	_, err := r.db.ExecContext(context.Background(), query, event.ID, event.Type, event.Payload, event.SenderID, event.ReceiveID, event.Status, event.CreateAt)
	return err
}

func (r *EventRepository) UpdateEventStatus(eventID string, status string) error {
	query := fmt.Sprintf("UPDATE %s.events SET status = $1 WHERE id = $2", r.eventSchema)
	_, err := r.db.ExecContext(context.Background(), query, status, eventID)
	return err
}