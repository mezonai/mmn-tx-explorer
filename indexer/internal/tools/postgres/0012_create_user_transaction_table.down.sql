-- Drop indexes first
DROP INDEX IF EXISTS idx_user_transaction_address_timestamp;
DROP INDEX IF EXISTS idx_user_transaction_addr_type_time;

-- Drop the user_transaction table
DROP TABLE IF EXISTS user_transaction;