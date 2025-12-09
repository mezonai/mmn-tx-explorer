-- Backfill entries where extra_info.type is 'give_coffee' (underscored) to canonical 'give-coffee'
-- This migration is robust: it only touches rows where extra_info looks like a JSON object

UPDATE transactions
SET transaction_extra_info_type = 'give-coffee'::transaction_extra_info_type_enum
WHERE extra_info IS NOT NULL
  AND extra_info IS JSON
  AND extra_info::jsonb ->> 'type' = 'give_coffee';
