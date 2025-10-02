-- Add indexes on from_address and to_address columns in transactions table for better query performance

CREATE INDEX IF NOT EXISTS idx_transactions_only_from_address 
ON transactions (from_address);

CREATE INDEX IF NOT EXISTS idx_transactions_only_to_address 
ON transactions (to_address);

CREATE INDEX IF NOT EXISTS idx_transactions_only_block_timestamp
ON transactions (block_timestamp);

CREATE INDEX IF NOT EXISTS idx_transactions_only_transaction_timestamp
ON transactions (transaction_timestamp);