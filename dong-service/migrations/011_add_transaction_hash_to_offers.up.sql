-- Add transaction_hash to offers for funding tx
ALTER TABLE IF EXISTS offers
ADD COLUMN IF NOT EXISTS transaction_hash TEXT NULL;

COMMENT ON COLUMN offers.transaction_hash IS 'Blockchain transaction hash for funding intermediary wallet (if funded by server)';
