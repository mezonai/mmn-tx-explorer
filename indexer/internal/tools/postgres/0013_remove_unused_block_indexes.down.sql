-- Rollback: Recreate the removed indexes from blocks table
-- This restores the indexes that were removed in the up migration

-- Recreate indexes for blocks table
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(chain_id, block_timestamp);
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(chain_id, block_number);
