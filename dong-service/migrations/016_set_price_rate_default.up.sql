-- Ensure price_rate defaults to 1 and backfill existing NULLs
ALTER TABLE offers
  ALTER COLUMN price_rate SET DEFAULT 1;

-- Backfill any existing NULL price_rate values to 1
UPDATE offers SET price_rate = 1 WHERE price_rate IS NULL;
