ALTER TABLE IF EXISTS dong_schema.orders
ADD COLUMN IF NOT EXISTS seller_wallet_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS seller_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_seller_wallet_address ON dong_schema.orders (seller_wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_seller_user_id ON dong_schema.orders (seller_user_id);
