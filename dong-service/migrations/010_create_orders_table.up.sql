-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGSERIAL PRIMARY KEY,
    intermediary_wallet_id BIGINT NOT NULL REFERENCES intermediary_wallet(id) ON DELETE RESTRICT,
    wallet_address VARCHAR(255) NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY','SELL')),
    symbol VARCHAR(64) NOT NULL,
    quantity NUMERIC(78,0) NOT NULL DEFAULT 0,
    price NUMERIC(78,0) NOT NULL DEFAULT 0,
    filled_quantity NUMERIC(78,0) NOT NULL DEFAULT 0,
    price_type VARCHAR(20) NOT NULL DEFAULT 'FIXED' CHECK (price_type IN ('FIXED','FLOAT')),
    price_reference VARCHAR(255) NULL,
    spread NUMERIC(39,0) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','OPEN','PARTIAL','FILLED','CANCELED','FAILED')),
    external_ref VARCHAR(255) NULL,
    metadata JSONB NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_intermediary_wallet_id ON orders(intermediary_wallet_id);
CREATE INDEX IF NOT EXISTS idx_orders_wallet_address ON orders(wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_symbol_status ON orders(symbol, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Install trigger to keep updated_at in sync. The function already exists in base schema migrations.
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill: convert legacy 'OPEN' to 'PENDING' (safe no-op if none)
UPDATE orders SET status = 'PENDING' WHERE status = 'OPEN';
