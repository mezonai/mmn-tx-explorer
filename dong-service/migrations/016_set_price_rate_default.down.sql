-- Revert price_rate default change
ALTER TABLE offers
  ALTER COLUMN price_rate DROP DEFAULT;
