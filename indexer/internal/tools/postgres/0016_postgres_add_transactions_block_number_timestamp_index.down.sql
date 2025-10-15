-- Drop composite index for block_number + transaction_timestamp DESC

DROP INDEX IF EXISTS idx_transactions_block_number_timestamp;

-- Drop composite index for transaction_timestamp + hash DESC

DROP INDEX IF EXISTS idx_transactions_timestamp_hash;
