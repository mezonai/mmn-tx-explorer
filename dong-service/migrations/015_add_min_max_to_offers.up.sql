-- Add per-transaction min/max columns to offers
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS min_amount NUMERIC(78,0) NULL,
  ADD COLUMN IF NOT EXISTS max_amount NUMERIC(78,0) NULL;

COMMENT ON COLUMN offers.min_amount IS 'Minimum amount per transaction (MZD)';
COMMENT ON COLUMN offers.max_amount IS 'Maximum amount per transaction (MZD)';
