-- Add index to speed up queries that filter by transaction_extra_info_type and status
-- This helps RecalculateStats and other queries that count give-coffee (transaction_extra_info_type = 'give-coffee') and use status filters
CREATE INDEX IF NOT EXISTS idx_transaction_extra_info_type_status
ON transactions (transaction_extra_info_type, status);
