-- Create enum only if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'order_status'
    ) THEN
        CREATE TYPE order_status AS ENUM (
            'PENDING', 'CONFIRMED', 'OPEN', 'CANCELED', 'FAILED', 'COMPLETED'
        );
    END IF;
END$$;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT,
    wallet_address VARCHAR(255),
    quantity BIGINT NOT NULL DEFAULT 0,
    amount BIGINT NOT NULL DEFAULT 0,
    price BIGINT NOT NULL DEFAULT 0,
    status order_status NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_offer_id ON orders (offer_id);
CREATE INDEX IF NOT EXISTS idx_orders_wallet_address ON orders (wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Add constraints and FK in a single maintenance block
DO $$
BEGIN
    -- Positive values constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_positive_values'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT chk_orders_positive_values
        CHECK (quantity >= 0 AND amount >= 0 AND price >= 0);
    END IF;

    -- Add foreign key if offers table exists
    IF EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'offers'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_offer_id'
        ) THEN
            ALTER TABLE orders
                ADD CONSTRAINT fk_orders_offer_id
                FOREIGN KEY (offer_id)
                REFERENCES offers (offer_id)
                ON DELETE SET NULL;
        END IF;
    END IF;
END$$;
