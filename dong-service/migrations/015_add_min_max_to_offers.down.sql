-- Drop min/max columns from offers
ALTER TABLE offers
  DROP COLUMN IF EXISTS min_amount,
  DROP COLUMN IF EXISTS max_amount;
