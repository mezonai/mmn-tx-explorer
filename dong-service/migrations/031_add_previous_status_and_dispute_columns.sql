-- Add previous_status column to p2p_orders table to track status transitions
ALTER TABLE dong_schema.p2p_orders
ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50);

-- Add in_dispute column to p2p_orders table
-- Set to TRUE when an order expires while in PENDING status (buyer confirmed payment but seller did not)
ALTER TABLE dong_schema.p2p_orders
ADD COLUMN IF NOT EXISTS in_dispute BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for quick lookups on previous_status
CREATE INDEX IF NOT EXISTS idx_orders_previous_status ON dong_schema.p2p_orders (previous_status);

-- Create partial index for dispute queries (only indexes rows where in_dispute = TRUE)
CREATE INDEX IF NOT EXISTS idx_orders_in_dispute ON dong_schema.p2p_orders (in_dispute) WHERE in_dispute = TRUE;
