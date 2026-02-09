-- Rename p2p tables
ALTER TABLE IF EXISTS dong_schema.offers RENAME TO p2p_offers;
ALTER TABLE IF EXISTS dong_schema.orders RENAME TO p2p_orders;

-- Rename amount columns to available_amount
ALTER TABLE dong_schema.p2p_offers RENAME COLUMN amount TO available_amount;
ALTER TABLE dong_schema.p2p_orders RENAME COLUMN amount TO order_amount;

-- Update p2p_offers table
ALTER TABLE dong_schema.p2p_offers
    ALTER COLUMN available_amount TYPE NUMERIC(78,0) USING available_amount::NUMERIC,
    ALTER COLUMN total_amount     TYPE NUMERIC(78,0) USING total_amount::NUMERIC,
    ALTER COLUMN min_amount       TYPE NUMERIC(78,0) USING min_amount::NUMERIC,
    ALTER COLUMN max_amount       TYPE NUMERIC(78,0) USING max_amount::NUMERIC,
    ALTER COLUMN payable_amount   TYPE NUMERIC(78,0) USING payable_amount::NUMERIC;

-- Update p2p_orders table
ALTER TABLE dong_schema.p2p_orders
    ALTER COLUMN order_amount   TYPE NUMERIC(78,0) USING order_amount::NUMERIC,
    ALTER COLUMN payable_amount TYPE NUMERIC(78,0) USING payable_amount::NUMERIC;