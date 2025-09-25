-- Remove extra_info column from transactions
ALTER TABLE IF EXISTS transactions
DROP COLUMN IF EXISTS extra_info;
