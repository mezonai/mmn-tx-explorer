-- 1. dong-give-coffee + give-coffee -> 0
UPDATE transactions
SET transaction_extra_info_type = 0
WHERE extra_info LIKE '{%'
  AND extra_info::jsonb ->> 'type' IN ('dong-give-coffee', 'give-coffee');

-- 2. donation-campaign -> 1
UPDATE transactions
SET transaction_extra_info_type = 1
WHERE extra_info LIKE '{%'
  AND extra_info::jsonb ->> 'type' = 'donation-campaign';

-- 3. withdraw-campaign -> 2
UPDATE transactions
SET transaction_extra_info_type = 2
WHERE extra_info LIKE '{%'
  AND extra_info::jsonb ->> 'type' = 'withdraw-campaign';
