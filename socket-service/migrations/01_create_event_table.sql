CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    receive_address VARCHAR(50) NOT NULL,
    create_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_events_receive_address ON events(receive_address);
CREATE INDEX idx_events_create_at ON events(create_at);