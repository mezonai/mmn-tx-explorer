-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
    offer_id BIGSERIAL PRIMARY KEY,
    intermediary_wallet_id BIGINT NOT NULL REFERENCES intermediary_wallet(id) ON DELETE RESTRICT,
    wallet_address VARCHAR(255) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY','SELL')),
    symbol VARCHAR(64) NOT NULL,
    quantity NUMERIC(78,0) NOT NULL DEFAULT 0,
    price NUMERIC(78,0) NOT NULL DEFAULT 0,
    filled_quantity NUMERIC(78,0) NOT NULL DEFAULT 0,
    price_type VARCHAR(20) NOT NULL DEFAULT 'FIXED' CHECK (price_type IN ('FIXED','FLOAT')),
    price_reference VARCHAR(255) NULL,
    spread NUMERIC(39,0) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('PENDING','CONFIRMED','OPEN','CANCELED','COMPLETED','EXPIRED')),
    external_ref VARCHAR(255) NULL,
    metadata JSONB NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_intermediary_wallet_id ON offers(intermediary_wallet_id);
CREATE INDEX IF NOT EXISTS idx_offers_wallet_address ON offers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_symbol_status ON offers(symbol, status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);

-- Install trigger to keep updated_at in sync. The function already exists in base schema migrations.
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill: convert legacy 'OPEN' to 'PENDING' (safe no-op if none)
UPDATE offers SET status = 'PENDING' WHERE status = 'OPEN';
