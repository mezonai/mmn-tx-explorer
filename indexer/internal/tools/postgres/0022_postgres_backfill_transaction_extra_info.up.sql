UPDATE transactions
SET transaction_extra_info_type = (
    CASE 
        WHEN extra_info IS NULL OR extra_info = '' OR extra_info !~ '^\s*\{.*\}\s*$' THEN 'token-transfer'
        WHEN replace(extra_info::jsonb ->> 'type', '_', '-') = 'dong-give-coffee' THEN 'dong-give-coffee'
        WHEN replace(extra_info::jsonb ->> 'type', '_', '-') = 'give-coffee' THEN 'give-coffee'
        WHEN replace(extra_info::jsonb ->> 'type', '_', '-') = 'donation-campaign' THEN 'donation-campaign'
        WHEN replace(extra_info::jsonb ->> 'type', '_', '-') = 'withdraw-campaign' THEN 'withdraw-campaign'
        WHEN replace(extra_info::jsonb ->> 'type', '_', '-') = 'lucky-money' THEN 'lucky-money'
        ELSE 'token-transfer'
    END
)::transaction_extra_info_type_enum
WHERE value >= 1000000;
