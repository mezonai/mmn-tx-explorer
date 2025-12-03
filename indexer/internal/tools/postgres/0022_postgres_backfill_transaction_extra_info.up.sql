UPDATE transactions
SET transaction_extra_info_type = (
    CASE 
        WHEN value < 1000000 OR extra_info IS NULL OR extra_info = '' OR extra_info !~ '^\s*\{.*\}\s*$' THEN 'token-transfer'
        WHEN extra_info::jsonb ->> 'type' = 'dong-give-coffee' THEN 'dong-give-coffee'
        WHEN extra_info::jsonb ->> 'type' = 'give-coffee' THEN 'give-coffee'
        WHEN extra_info::jsonb ->> 'type' = 'donation-campaign' THEN 'donation-campaign'
        WHEN extra_info::jsonb ->> 'type' = 'withdraw-campaign' THEN 'withdraw-campaign'
        WHEN extra_info::jsonb ->> 'type' = 'lucky-money' THEN 'lucky-money'
        ELSE 'token-transfer'
    END
)::transaction_extra_info_type_enum;
