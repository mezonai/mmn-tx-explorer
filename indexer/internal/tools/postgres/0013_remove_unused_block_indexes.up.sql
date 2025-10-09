-- Remove unused indexes from blocks table
-- After removing columns, some indexes may no longer be needed or may reference non-existent columns

-- Drop indexes that may reference removed columns or are redundant
DROP INDEX IF EXISTS idx_blocks_timestamp;
DROP INDEX IF EXISTS idx_blocks_hash;
DROP INDEX IF EXISTS idx_blocks_number;

-- Keep only the primary key index which is automatically created
-- The primary key (chain_id, block_number) is sufficient for most queries
