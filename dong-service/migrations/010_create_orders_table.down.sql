-- Drop orders table and associated trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TABLE IF EXISTS orders;
