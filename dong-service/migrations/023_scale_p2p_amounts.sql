-- Drop any ghost triggers that might be using old column names (e.g. "amount")
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'dong_schema' 
        AND (event_object_table = 'p2p_offers' OR event_object_table = 'p2p_orders')
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON dong_schema.' || r.event_object_table;
    END LOOP;
END $$;

-- Scale p2p_offers amounts by 1,000,000
UPDATE dong_schema.p2p_offers
SET available_amount = available_amount * 1000000,
    total_amount = total_amount * 1000000,
    min_amount = min_amount * 1000000,
    max_amount = max_amount * 1000000;

-- Scale p2p_orders amounts by 1,000,000
UPDATE dong_schema.p2p_orders
SET order_amount = order_amount * 1000000;
