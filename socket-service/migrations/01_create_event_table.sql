CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    receiver_id VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(16) DEFAULT 'delivered',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_room_id ON events(room_id);
CREATE INDEX idx_events_sender_id ON events(sender_id);
CREATE INDEX idx_events_receiver_id ON events(receiver_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_at ON events(created_at);