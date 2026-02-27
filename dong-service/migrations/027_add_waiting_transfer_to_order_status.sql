DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'order_status' AND e.enumlabel = 'WAITING_TRANSFER'
    ) THEN
        ALTER TYPE order_status ADD VALUE 'WAITING_TRANSFER';
    END IF;
END $$;
