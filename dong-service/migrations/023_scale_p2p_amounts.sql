-- Scale p2p_offers amounts by 1,000,000
UPDATE dong_schema.p2p_offers
SET available_amount = available_amount * 1000000,
    total_amount = total_amount * 1000000,
    min_amount = min_amount * 1000000,
    max_amount = max_amount * 1000000;
-- Scale p2p_orders amounts by 1,000,000
UPDATE dong_schema.p2p_orders
SET order_amount = order_amount * 1000000;
