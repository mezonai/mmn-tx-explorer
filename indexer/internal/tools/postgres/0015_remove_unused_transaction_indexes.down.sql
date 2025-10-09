-- Rollback: Recreate indexes that were removed
-- This is a rollback script in case we need to restore the indexes

-- Recreate indexes that reference deleted columns (will fail if columns don't exist)
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(chain_id, block_timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_function_selector ON transactions(function_selector);
CREATE INDEX IF NOT EXISTS idx_transactions_only_block_timestamp ON transactions(block_timestamp);

-- Recreate redundant index that was removed
CREATE INDEX IF NOT EXISTS idx_transactions_tx_timestamp ON transactions(chain_id, transaction_timestamp DESC);

-- Recreate unused index that was removed
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(chain_id, to_address, block_number);

-- Recreate redundant index that was removed
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(chain_id, from_address, block_number);