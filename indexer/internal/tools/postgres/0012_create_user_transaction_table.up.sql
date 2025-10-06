-- Create user_transaction table to track transaction participation
-- transaction_type: 0 = sender, 1 = receiver
CREATE TABLE IF NOT EXISTS user_transaction (
    address TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    transaction_type SMALLINT NOT NULL CHECK (transaction_type IN (0, 1)),
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (address, transaction_hash, transaction_type)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_transaction_address ON user_transaction(address);
CREATE INDEX IF NOT EXISTS idx_user_transaction_hash ON user_transaction(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_user_transaction_timestamp ON user_transaction("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_user_transaction_address_type ON user_transaction(address, transaction_type);

-- Add comment for transaction_type
COMMENT ON COLUMN user_transaction.transaction_type IS '0: sender, 1: receiver';