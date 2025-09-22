-- PostgreSQL migration: Add transaction_count column to wallet table
-- This migration adds transaction_count column to track wallet transaction count

-- Add new column with default value
ALTER TABLE wallet ADD COLUMN transaction_count INTEGER DEFAULT 0;

-- Create index for performance on transaction_count queries
CREATE INDEX IF NOT EXISTS idx_wallet_transaction_count ON wallet(transaction_count);

-- Optional: Populate transaction_count for existing wallets
-- This query counts transactions where wallet is either sender or receiver
-- Uncomment and run after migration if you want to populate existing data
/*
UPDATE wallet
SET transaction_count = COALESCE((
    SELECT COUNT(*)
    FROM transactions
    WHERE from_address = wallet.address OR to_address = wallet.address
), 0);
*/
