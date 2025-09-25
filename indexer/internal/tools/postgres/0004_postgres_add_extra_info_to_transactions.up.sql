-- Add extra_info column to transactions
ALTER TABLE IF EXISTS transactions
ADD COLUMN IF NOT EXISTS extra_info TEXT;
