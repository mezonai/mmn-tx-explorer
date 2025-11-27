-- Drop composite index for transaction_timestamp + hash DESC

DROP INDEX IF EXISTS idx_transactions_timestamp_hash;
