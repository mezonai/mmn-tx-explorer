-- This helps RecalculateStats and other queries that count give-coffee (transaction_type = 0) and use status filters
CREATE INDEX IF NOT EXISTS idx_transactions_type_status
ON transactions (transaction_type, status);
