-- Backfill/conversion to enum-backed storage. This migration is idempotent and handles
-- both cases: when the column is SMALLINT (convert type) or already an enum (just update labels from JSON).
DO $$
BEGIN
    -- Ensure the enum type exists
    BEGIN
        CREATE TYPE transaction_extra_info_type_enum AS ENUM ('give-coffee', 'donation-campaign', 'withdraw-campaign', 'lucky-money');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- If the column is SMALLINT, change its type to the enum with a mapping from numbers and JSON
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'transaction_extra_info_type' AND data_type = 'smallint'
    ) THEN
        ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type DROP DEFAULT;
        ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type TYPE transaction_extra_info_type_enum
        USING (
            CASE
                WHEN extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' IN ('dong-give-coffee', 'give-coffee') THEN 'give-coffee'
                WHEN extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' = 'donation-campaign' THEN 'donation-campaign'
                WHEN extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' = 'withdraw-campaign' THEN 'withdraw-campaign'
                WHEN extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' = 'lucky-money' THEN 'lucky-money'
                ELSE 'give-coffee'
            END
        )::transaction_extra_info_type_enum;
        ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type SET DEFAULT 'give-coffee';

    ELSE
        -- Column was already converted to enum: ensure values coming from JSON are updated to enum labels
        UPDATE transactions
        SET transaction_extra_info_type = 'give-coffee'
        WHERE extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' IN ('dong-give-coffee', 'give-coffee');

        UPDATE transactions
        SET transaction_extra_info_type = 'donation-campaign'
        WHERE extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' = 'donation-campaign';

        UPDATE transactions
        SET transaction_extra_info_type = 'withdraw-campaign'
        WHERE extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' = 'withdraw-campaign';

        UPDATE transactions
        SET transaction_extra_info_type = 'lucky-money'
        WHERE extra_info LIKE '{%' AND extra_info::jsonb ->> 'type' = 'lucky-money';
    END IF;
END $$;
