CREATE TABLE IF NOT EXISTS bridge_checkpoint (
    id SERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bridge_transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    recipient VARCHAR(255) NOT NULL,
    amount VARCHAR(100) NOT NULL,
    memo TEXT,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    out_tx_hash VARCHAR(66),
    error_message TEXT
);

CREATE INDEX idx_bridge_tx_hash ON bridge_transactions (tx_hash);
CREATE INDEX idx_bridge_recipient ON bridge_transactions (recipient);