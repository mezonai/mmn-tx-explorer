-- Add composite index for block_number + transaction_timestamp DESC
-- This index optimizes queries filtering by block_number and ordering by transaction_timestamp DESC

CREATE INDEX IF NOT EXISTS idx_transactions_block_number_timestamp 
ON transactions (block_number, transaction_timestamp DESC);
