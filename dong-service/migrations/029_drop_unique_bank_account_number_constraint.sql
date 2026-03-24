ALTER TABLE dong_schema.user_payment_info
DROP CONSTRAINT IF EXISTS user_payment_info_bank_name_account_number_key;

ALTER TABLE dong_schema.user_payment_info ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ON dong_schema.user_payment_info (user_id)
WHERE is_primary = true AND deleted_at IS NULL;
