-- Drop column and index added in 0020
DROP INDEX IF EXISTS idx_transactions_extra_info_type;
ALTER TABLE transactions DROP COLUMN IF EXISTS transaction_extra_info_type;
-- Try to drop enum if it exists (safe no-op if another migration created/keeps the type)
DROP TYPE IF EXISTS transaction_extra_info_type_enum;
