-- Drop column and index added in 0020
DROP INDEX IF EXISTS idx_transactions_extra_info_type;
ALTER TABLE transactions DROP COLUMN IF EXISTS transaction_extra_info_type;
