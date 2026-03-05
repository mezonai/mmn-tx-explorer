-- Add bank_info column to p2p_orders table
ALTER TABLE dong_schema.p2p_orders
    ADD COLUMN IF NOT EXISTS bank_info JSONB;

-- Optional: Create an index on bank_info for better query performance
CREATE INDEX IF NOT EXISTS idx_p2p_orders_bank_info ON dong_schema.p2p_orders USING GIN (bank_info);
