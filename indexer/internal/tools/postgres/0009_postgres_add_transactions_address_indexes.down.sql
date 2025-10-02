-- Remove indexes on from_address and to_address columns in transactions table

DROP INDEX IF EXISTS idx_transactions_only_from_address;
DROP INDEX IF EXISTS idx_transactions_only_to_address;
DROP INDEX IF EXISTS idx_transactions_only_block_timestamp;