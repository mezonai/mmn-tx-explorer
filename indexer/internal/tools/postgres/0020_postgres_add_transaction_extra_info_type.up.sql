CREATE TYPE transaction_extra_info_type_enum AS ENUM (
            'give-coffee',
            'donation-campaign',
            'withdraw-campaign',
            'lucky-money',
            'token-transfer'
        );

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_extra_info_type transaction_extra_info_type_enum;

UPDATE transactions
SET transaction_extra_info_type = (
    CASE 
        WHEN extra_info IS NULL OR extra_info = '' THEN 'token-transfer'
        WHEN (extra_info::jsonb ->> 'type') IN ('dong-give-coffee', 'give-coffee') THEN 'give-coffee'
        WHEN extra_info::jsonb ->> 'type' = 'donation-campaign' THEN 'donation-campaign'
        WHEN extra_info::jsonb ->> 'type' = 'withdraw-campaign' THEN 'withdraw-campaign'
        WHEN extra_info::jsonb ->> 'type' = 'lucky-money' THEN 'lucky-money'
        ELSE 'token-transfer'
    END
)::transaction_extra_info_type_enum;

ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type SET DEFAULT 'token-transfer';