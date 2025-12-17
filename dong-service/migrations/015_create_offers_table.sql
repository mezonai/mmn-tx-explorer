DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
        CREATE TYPE offer_status AS ENUM ('OPEN', 'PENDING', 'CONFIRMED', 'CANCELED', 'FAILED', 'COMPLETED');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS offers (
    offer_id BIGSERIAL PRIMARY KEY,
    intermediary_wallet_address VARCHAR(255),
    seller_wallet_address VARCHAR(255),
    side VARCHAR(8) NOT NULL,
    symbol VARCHAR(64) NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    min_amount BIGINT NOT NULL DEFAULT 1,
    max_amount BIGINT NOT NULL,
    payable_amount BIGINT NOT NULL DEFAULT 0,
    price_rate NUMERIC(6, 4),
    status offer_status NOT NULL DEFAULT 'OPEN',
    transaction_hash TEXT,
    bank_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offers_symbol ON offers (symbol);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers (status);
CREATE INDEX IF NOT EXISTS idx_offers_intermediary_wallet_address ON offers (intermediary_wallet_address);

-- Optional constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_offers_side') THEN
        ALTER TABLE offers ADD CONSTRAINT chk_offers_side CHECK (side IN ('BUY', 'SELL'));
    END IF;
    
END$$;
