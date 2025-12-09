-- Add a CHECK constraint to ensure intermediary_wallet.type is one of the allowed values
-- Be defensive: only add the constraint if it does not already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_intermediary_wallet_type'
    ) THEN
        ALTER TABLE intermediary_wallet
        ADD CONSTRAINT chk_intermediary_wallet_type
            CHECK (type IN ('DEFAULT', 'LUCKY_MONEY', 'OFFER'));
    END IF;
END$$;
