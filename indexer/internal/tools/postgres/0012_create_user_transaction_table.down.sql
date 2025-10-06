-- Drop indexes first
DROP INDEX IF EXISTS idx_user_transaction_address;
DROP INDEX IF EXISTS idx_user_transaction_hash;
DROP INDEX IF EXISTS idx_user_transaction_timestamp;
DROP INDEX IF EXISTS idx_user_transaction_address_type;

-- Drop the user_transaction table
DROP TABLE IF EXISTS user_transaction;