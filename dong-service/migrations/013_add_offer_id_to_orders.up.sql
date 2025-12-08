-- Add offer_id and amount columns to orders so an offer can have multiple orders and store order amount
BEGIN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_id BIGINT NULL REFERENCES offers(offer_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_offer_id ON orders(offer_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount NUMERIC(78,0) NULL;
CREATE INDEX IF NOT EXISTS idx_orders_amount ON orders(amount);
COMMIT;
