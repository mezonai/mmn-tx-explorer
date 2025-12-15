DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('OPEN', 'PENDING', 'CONFIRMED', 'CANCELED', 'FAILED', "COMPLETED");
    END IF;
END $$;


-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT,
    buyer_wallet_address VARCHAR(255),
    amount BIGINT NOT NULL DEFAULT 0,
    payable_amount BIGINT NOT NULL DEFAULT 0,
    transaction_hash TEXT,
    status order_status NOT NULL DEFAULT 'OPEN',
    transfer_code VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_offer_id ON orders (offer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_wallet_address ON orders (buyer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Add constraints and FK in a single maintenance block
DO $$ BEGIN
    -- numeric constraints
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_positive_values') THEN
        ALTER TABLE orders
            ADD CONSTRAINT chk_orders_positive_values CHECK (amount >= 0 AND payable_amount >= 0);
    END IF;

    -- foreign key
    IF to_regclass('offers') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_offer_id') THEN
        ALTER TABLE orders
            ADD CONSTRAINT fk_orders_offer_id
            FOREIGN KEY (offer_id) REFERENCES offers(offer_id)
            ON DELETE SET NULL;
    END IF;
END $$;
