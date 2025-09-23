-- Add is_missing flag to blocks table (Plan A)
ALTER TABLE blocks
  ADD COLUMN IF NOT EXISTS is_missing BOOLEAN NOT NULL DEFAULT FALSE;
