-- Remove extra_info column from transactions table
ALTER TABLE transactions
DROP COLUMN IF EXISTS extra_info;
