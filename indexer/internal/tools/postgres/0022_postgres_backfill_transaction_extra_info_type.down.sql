BEGIN;

ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type DROP DEFAULT;

ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type TYPE SMALLINT
USING (
    CASE transaction_extra_info_type::text
        WHEN 'give-coffee' THEN 0
        WHEN 'donation-campaign' THEN 1
        WHEN 'withdraw-campaign' THEN 2
        WHEN 'lucky-money' THEN 3
        ELSE 0
    END
);

ALTER TABLE transactions ALTER COLUMN transaction_extra_info_type SET DEFAULT 0;

DROP TYPE IF EXISTS transaction_extra_info_type_enum;

COMMIT;
