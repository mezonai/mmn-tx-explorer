-- Add composite index for block_number + transaction_timestamp DESC
-- This index optimizes queries filtering by block_number and ordering by transaction_timestamp DESC

CREATE INDEX IF NOT EXISTS idx_transactions_block_number_timestamp 
ON transactions (block_number, transaction_timestamp DESC);

-- Add composite index for transaction_timestamp + hash DESC
-- This index optimizes pagination queries that order by timestamp and hash
-- Especially useful for cursor-based pagination when multiple transactions have the same timestamp

CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_hash 
ON transactions (transaction_timestamp DESC, hash DESC);
