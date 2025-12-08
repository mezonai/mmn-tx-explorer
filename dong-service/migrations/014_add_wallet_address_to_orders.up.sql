-- Migration: add wallet_address column to orders for caller address
-- Add nullable wallet_address column so the application can start writing
-- wallet addresses for new orders without touching legacy user_id data.

BEGIN;

-- Add column (nullable) to allow safe rollouts
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255) NULL;

-- Create index for fast lookups by wallet address
CREATE INDEX IF NOT EXISTS idx_orders_wallet_address ON orders(wallet_address);

-- IMPORTANT: data migration (optional)
-- If you have a users table with a wallet_address column you can populate
-- the new column using a statement like the example below (UNCOMMENT and
-- edit to match your users table schema). This repository does not assume
-- a users table shape so we leave this commented to avoid accidental failures.
--
-- UPDATE orders o
-- SET wallet_address = u.wallet_address
-- FROM users u
-- WHERE o.user_id IS NOT NULL AND o.user_id = u.id;

COMMIT;
