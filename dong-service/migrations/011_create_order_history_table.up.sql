CREATE TABLE IF NOT EXISTS order_history (
    history_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    -- We'll add explicit created states: CREATED_PENDING and CREATED_CONFIRMED.
    -- To support existing rows during migration we temporarily allow 'CREATED', backfill, then enforce the new set.
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('CREATED','CREATED_PENDING','CREATED_CONFIRMED','PARTIAL_FILL','FILL','CANCELED','UPDATED','FAILED')),
    quantity NUMERIC(78,0) NOT NULL DEFAULT 0,
    execution_price NUMERIC(78,0) NULL,
    source VARCHAR(255) NULL,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_event_type ON order_history(event_type);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at);

-- Backfill existing rows: map legacy 'CREATED' -> 'CREATED_PENDING'
UPDATE order_history SET event_type = 'CREATED_PENDING' WHERE event_type = 'CREATED';

-- Re-apply stricter constraint (disallow legacy 'CREATED')
ALTER TABLE order_history DROP CONSTRAINT IF EXISTS order_history_event_type_check;
ALTER TABLE order_history ADD CONSTRAINT order_history_event_type_check
    CHECK (event_type IN ('CREATED_PENDING','CREATED_CONFIRMED','PARTIAL_FILL','FILL','CANCELED','UPDATED','FAILED'));
