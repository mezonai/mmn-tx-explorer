-- Remove is_missing flag from blocks table (rollback for 0004)
ALTER TABLE blocks
  DROP COLUMN IF EXISTS is_missing;
