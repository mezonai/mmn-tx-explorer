DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = 'order_status'
          AND e.enumlabel = 'EXPIRED'
          AND n.nspname = current_schema()
    ) THEN
        ALTER TYPE order_status ADD VALUE 'EXPIRED';
    END IF;