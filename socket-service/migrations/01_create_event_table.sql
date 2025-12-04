CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    receive_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    create_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_events_receive_id ON events(receive_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_create_at ON events(create_at);