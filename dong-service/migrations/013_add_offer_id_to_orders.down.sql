-- Remove offer_id and amount columns from orders
BEGIN;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_offer_id_fkey;
DROP INDEX IF EXISTS idx_orders_offer_id;
ALTER TABLE orders DROP COLUMN IF EXISTS offer_id;

ALTER TABLE orders DROP COLUMN IF EXISTS amount;
DROP INDEX IF EXISTS idx_orders_amount;
COMMIT;
