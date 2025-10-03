-- Add index to optimize sorting by transaction_timestamp for transactions API
CREATE INDEX IF NOT EXISTS idx_transactions_tx_timestamp
ON transactions (chain_id, transaction_timestamp DESC);
