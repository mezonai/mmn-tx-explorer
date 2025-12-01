-- Add transaction_extra_info_type column to transactions (used to classify extra_info types like give-coffee)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transaction_extra_info_type SMALLINT NOT NULL DEFAULT 0;
