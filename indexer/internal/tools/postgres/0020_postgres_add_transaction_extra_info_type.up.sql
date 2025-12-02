-- Add transaction_extra_info_type column to transactions (used to classify extra_info types like give-coffee)
-- Create a Postgres enum type for readability and add column using it.
BEGIN;

DO $$
BEGIN
	CREATE TYPE transaction_extra_info_type_enum AS ENUM ('give-coffee', 'donation-campaign', 'withdraw-campaign', 'lucky-money');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transaction_extra_info_type transaction_extra_info_type_enum NOT NULL DEFAULT 'give-coffee';

COMMIT;
