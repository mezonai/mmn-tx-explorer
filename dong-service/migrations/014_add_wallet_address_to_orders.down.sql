-- Revert migration: remove wallet_address column and index from orders

BEGIN;

DROP INDEX IF EXISTS idx_orders_wallet_address;

ALTER TABLE IF EXISTS orders DROP COLUMN IF EXISTS wallet_address;

COMMIT;
