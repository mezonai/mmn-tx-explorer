ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type DROP DEFAULT;
ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type TYPE transaction_extra_info_type_enum
USING (
    CASE 
        WHEN extra_info IS NULL OR extra_info = '' THEN 'token-transfer'
        WHEN (extra_info::jsonb ->> 'type') IN ('dong-give-coffee', 'give-coffee') THEN 'give-coffee'
        WHEN extra_info::jsonb ->> 'type' = 'donation-campaign' THEN 'donation-campaign'
        WHEN extra_info::jsonb ->> 'type' = 'withdraw-campaign' THEN 'withdraw-campaign'
        WHEN extra_info::jsonb ->> 'type' = 'lucky-money' THEN 'lucky-money'
        ELSE 'token-transfer'
    END
)::transaction_extra_info_type_enum;
