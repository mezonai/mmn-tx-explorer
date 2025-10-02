-- Remove index
DROP INDEX IF EXISTS idx_wallet_last_block;

-- Remove column
ALTER TABLE wallet DROP COLUMN IF EXISTS last_block;
