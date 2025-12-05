-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
    offer_id BIGSERIAL PRIMARY KEY,
    intermediary_wallet_id BIGINT NOT NULL REFERENCES intermediary_wallet(id) ON DELETE RESTRICT,
    wallet_address VARCHAR(255) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY','SELL')),
    symbol VARCHAR(64) NOT NULL,
    quantity NUMERIC(78,0) NOT NULL DEFAULT 0,
    total_quantity NUMERIC(78,0) NOT NULL DEFAULT 0,
    price NUMERIC(78,0) NOT NULL DEFAULT 0,
    price_type VARCHAR(20) NOT NULL DEFAULT 'FIXED' CHECK (price_type IN ('FIXED','FLOAT')),
    price_rate NUMERIC(38,18) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('PENDING','CONFIRMED','OPEN','CANCELED','COMPLETED')),
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_wallet_address ON offers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);

-- Install trigger to keep updated_at in sync. The function already exists in base schema migrations.
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
