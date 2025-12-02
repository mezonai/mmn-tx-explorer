-- Drop column added in 0020 (index is created/dropped by 0021 migration)
ALTER TABLE transactions DROP COLUMN IF EXISTS transaction_extra_info_type;
-- Try to drop enum if it exists (safe no-op if another migration created/keeps the type)
-- Try to drop enum if it exists (safe no-op if another migration created/keeps the type)
DROP TYPE IF EXISTS transaction_extra_info_type_enum;
