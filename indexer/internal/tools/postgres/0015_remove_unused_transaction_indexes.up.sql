-- Remove indexes that reference deleted columns from transactions table
-- Keep only indexes for columns that still exist after migration 0014

-- Remove indexes that reference deleted columns
DROP INDEX IF EXISTS idx_transactions_timestamp; -- references block_timestamp (deleted)
DROP INDEX IF EXISTS idx_transactions_function_selector; -- references function_selector (deleted)
DROP INDEX IF EXISTS idx_transactions_only_block_timestamp; -- references block_timestamp (deleted)

-- Remove redundant index that is covered by idx_transactions_only_transaction_timestamp
DROP INDEX IF EXISTS idx_transactions_tx_timestamp; -- redundant with idx_transactions_only_transaction_timestamp

-- Remove unused index that is not used by any queries
DROP INDEX IF EXISTS idx_transactions_to_address; -- not used, wallet queries use idx_transactions_to_address_timestamp

-- Remove redundant index that is covered by idx_transactions_from_address_timestamp
DROP INDEX IF EXISTS idx_transactions_from_address; -- redundant with idx_transactions_from_address_timestamp

-- Keep these indexes as they reference existing columns:
-- idx_transactions_block_hash (block_hash - exists)
-- idx_transactions_hash (hash - exists) 
-- idx_transactions_from_address_timestamp (from_address, transaction_timestamp - both exist)
-- idx_transactions_to_address_timestamp (to_address, transaction_timestamp - both exist)
-- idx_transactions_only_from_address (from_address - exists)
-- idx_transactions_only_to_address (to_address - exists)
-- idx_transactions_only_transaction_timestamp (transaction_timestamp - exists)
