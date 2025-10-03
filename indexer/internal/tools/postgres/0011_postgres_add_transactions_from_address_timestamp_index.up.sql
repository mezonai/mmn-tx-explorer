-- Add composite index for from_address + transaction_timestamp DESC
-- This index optimizes queries filtering by from_address and ordering by transaction_timestamp DESC

CREATE INDEX IF NOT EXISTS idx_transactions_from_address_timestamp 
ON transactions (from_address, transaction_timestamp DESC);

-- Also add the same index for to_address for wallet queries
CREATE INDEX IF NOT EXISTS idx_transactions_to_address_timestamp 
ON transactions (to_address, transaction_timestamp DESC);
