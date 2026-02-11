DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'EXPIRED'
          AND enumtypid = (
              SELECT oid FROM pg_type WHERE typname = 'order_status'
          )
    ) THEN
        ALTER TYPE order_status ADD VALUE 'EXPIRED';
    END IF;
END $$;