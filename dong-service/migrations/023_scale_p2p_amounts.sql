-- Scale p2p_orders amounts by 1,000,000
UPDATE dong_schema.p2p_orders
SET order_amount = order_amount * 1000000;
