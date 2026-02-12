-- Add previous_status column to p2p_orders to track status before expiration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'dong_schema'
          AND table_name = 'p2p_orders'
          AND column_name = 'previous_status'
    ) THEN
        ALTER TABLE dong_schema.p2p_orders
        ADD COLUMN previous_status VARCHAR(20);
    END IF;
END $$;
