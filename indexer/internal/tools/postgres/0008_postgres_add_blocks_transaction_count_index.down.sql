-- Remove index created for optimizing blocks API
DROP INDEX IF EXISTS idx_blocks_chain_id_transaction_count;
