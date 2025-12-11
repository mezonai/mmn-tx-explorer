package repository

import (
	"context"
	"database/sql"
	"fmt"
	"socket-service/models"
	"socket-service/constant"
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

func (r *EventRepository) GetListEventByReceiver(receiveAddress string) ([]models.Event, error) {
	query := `SELECT id, type, payload, receive_address, status, create_at FROM events WHERE receive_address = $1 AND status = $2`
	rows, err := r.db.Query(query, receiveAddress, constant.EventStatusPending)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var events []models.Event
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(&event.ID, &event.Type, &event.Payload, &event.ReceiveAddress, &event.Status, &event.CreateAt); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, nil
}

func (r *EventRepository) SaveEvent(event *models.Event) error {
	query := fmt.Sprintf("INSERT INTO %s.events (type, payload, receive_address, status, create_at) VALUES ($1, $2, $3, $4, $5) RETURNING id", r.eventSchema)
	err := r.db.QueryRowContext(context.Background(), query, event.Type, event.Payload, event.ReceiveAddress, event.Status, event.CreateAt).Scan(&event.ID)
	return err
}

func (r *EventRepository) UpdateEventStatus(eventID string, status string) error {
	query := fmt.Sprintf("UPDATE %s.events SET status = $1 WHERE id = $2", r.eventSchema)
	_, err := r.db.ExecContext(context.Background(), query, status, eventID)
	return err
}
