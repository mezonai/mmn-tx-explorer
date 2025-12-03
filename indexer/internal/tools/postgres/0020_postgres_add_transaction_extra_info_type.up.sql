CREATE TYPE transaction_extra_info_type_enum AS ENUM (
            'dong-give-coffee',
            'give-coffee',
            'donation-campaign',
            'withdraw-campaign',
            'lucky-money',
            'token-transfer'
        );

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_extra_info_type transaction_extra_info_type_enum;

ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type SET DEFAULT 'token-transfer';