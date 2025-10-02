-- Add last_block column to wallet table
ALTER TABLE wallet ADD COLUMN last_block BIGINT;

-- Add index for better query performance
CREATE INDEX idx_wallet_last_block ON wallet(last_block);
