-- Drop the composite indexes for from_address and to_address with transaction_timestamp

DROP INDEX IF EXISTS idx_transactions_from_address_timestamp;
DROP INDEX IF EXISTS idx_transactions_to_address_timestamp;
