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

func (r *EventRepository) GetListEventByReceiver(receiveAddress string) ([]models.Event, error) {
	query := fmt.Sprintf("SELECT id, type, payload, receive_address, create_at FROM %s.events WHERE receive_address = $1", r.eventSchema)
	rows, err := r.db.Query(query, receiveAddress)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var events []models.Event
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(&event.ID, &event.Type, &event.Payload, &event.ReceiveAddress, &event.CreateAt); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, nil
}

func (r *EventRepository) SaveEvent(event *models.Event) error {
	query := fmt.Sprintf("INSERT INTO %s.events (id, type, payload, receive_address, create_at) VALUES ($1, $2, $3, $4, $5)", r.eventSchema)
	_, err := r.db.ExecContext(context.Background(), query, event.ID, event.Type, event.Payload, event.ReceiveAddress, event.CreateAt)
	return err
}

func (r *EventRepository) DeleteEvent(eventID string) error {
	query := fmt.Sprintf("DELETE FROM %s.events WHERE id = $1", r.eventSchema)
	_, err := r.db.ExecContext(context.Background(), query, eventID)
	return err
}
