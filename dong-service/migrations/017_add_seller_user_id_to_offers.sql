ALTER TABLE IF EXISTS dong_schema.offers
ADD COLUMN IF NOT EXISTS seller_user_id BIGINT;

ALTER TABLE IF EXISTS dong_schema.orders
ADD COLUMN IF NOT EXISTS buyer_user_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_offers_seller_user_id ON dong_schema.offers (seller_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_user_id ON dong_schema.orders (buyer_user_id);
