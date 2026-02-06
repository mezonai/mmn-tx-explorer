ALTER TABLE IF EXISTS dong_schema.orders
ADD COLUMN IF NOT EXISTS offer_type VARCHAR(8),
ADD COLUMN IF NOT EXISTS bank_info JSONB;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_offer_type') THEN
        ALTER TABLE dong_schema.orders ADD CONSTRAINT chk_orders_offer_type CHECK (offer_type IN ('BUY', 'SELL'));
    END IF;
END$$;
