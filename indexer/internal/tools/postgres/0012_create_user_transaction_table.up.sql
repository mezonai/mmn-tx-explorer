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
);

-- Add composite index for queries filtering by address and sorting by timestamp
CREATE INDEX IF NOT EXISTS idx_user_transaction_address_timestamp ON user_transaction(address, "timestamp" DESC);
-- Add composite index for queries filtering by address and transaction_type, sorting by timestamp
CREATE INDEX IF NOT EXISTS idx_user_transaction_addr_type_time ON user_transaction(address, transaction_type, "timestamp" DESC);