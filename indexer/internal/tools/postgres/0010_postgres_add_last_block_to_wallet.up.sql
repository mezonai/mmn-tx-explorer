-- Add last_block column to wallet table
ALTER TABLE wallet ADD COLUMN last_block BIGINT;

-- Update existing records with the last block number from their transactions
UPDATE wallet w
SET last_block = (
    SELECT MAX(t.block_number)
    FROM transactions t
    WHERE t.from_address = w.address OR t.to_address = w.address
);

-- Add index for better query performance
CREATE INDEX idx_wallet_last_block ON wallet(last_block);
