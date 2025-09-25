-- Add extra_info column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS extra_info String AFTER status;
