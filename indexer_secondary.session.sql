-- PostgreSQL schema for orchestrator storage
-- This database is used for orchestration metadata and cursors

-- Create orchestrator database (run this separately)
-- CREATE DATABASE indexer_orchestrator;

-- Connect to orchestrator database and run the following:

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Block failures table
CREATE TABLE IF NOT EXISTS block_failures (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    last_error_timestamp BIGINT NOT NULL,
    failure_count INTEGER DEFAULT 1,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for block failures table
CREATE INDEX IF NOT EXISTS idx_block_failures_block_number_ordered ON block_failures(chain_id, block_number DESC);

-- Cursors table for tracking various processing positions
CREATE TABLE IF NOT EXISTS cursors (
    chain_id NUMERIC(78, 0) NOT NULL,
    cursor_type VARCHAR(30) NOT NULL,
    cursor_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, cursor_type)
) WITH (fillfactor = 80);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_block_failures_updated_at BEFORE UPDATE ON block_failures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cursors_updated_at BEFORE UPDATE ON cursors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- PostgreSQL schema for staging storage
-- This database is used for temporary storage during data processing

-- Create staging database (run this separately)
-- CREATE DATABASE indexer_staging;

-- Connect to staging database and run the following:

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Block data table for staging
CREATE TABLE IF NOT EXISTS block_data (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for staging table
CREATE INDEX IF NOT EXISTS idx_staging_block_data_chain_id ON block_data(chain_id);
CREATE INDEX IF NOT EXISTS idx_staging_block_data_number ON block_data(chain_id, block_number);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_block_data_updated_at BEFORE UPDATE ON block_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- PostgreSQL schema for main storage tables
-- This schema is designed to be compatible with the ClickHouse schema
-- while leveraging PostgreSQL-specific features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    hash VARCHAR(66) NOT NULL,
    parent_hash VARCHAR(66) NOT NULL,
    sha3_uncles VARCHAR(66) NOT NULL,
    nonce VARCHAR(18) NOT NULL,
    mix_hash VARCHAR(66) NOT NULL,
    miner TEXT NOT NULL,
    state_root VARCHAR(66) NOT NULL,
    transactions_root VARCHAR(66) NOT NULL,
    receipts_root VARCHAR(66) NOT NULL,
    logs_bloom TEXT NOT NULL,
    size BIGINT NOT NULL,
    extra_data TEXT NOT NULL,
    difficulty NUMERIC(78, 0) NOT NULL,
    total_difficulty NUMERIC(78, 0) NOT NULL,
    transaction_count BIGINT NOT NULL,
    gas_limit NUMERIC(78, 0) NOT NULL,
    gas_used NUMERIC(78, 0) NOT NULL,
    withdrawals_root VARCHAR(66),
    base_fee_per_gas BIGINT,
    insert_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sign SMALLINT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for blocks table
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(chain_id, block_timestamp);
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(chain_id, block_number);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    chain_id NUMERIC(78, 0) NOT NULL,
    hash VARCHAR(66) NOT NULL,
    nonce BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_index BIGINT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT,
    value NUMERIC(78, 0) NOT NULL,
    gas BIGINT NOT NULL,
    gas_price NUMERIC(78, 0) NOT NULL,
    data TEXT NOT NULL,
    function_selector VARCHAR(10),
    max_fee_per_gas NUMERIC(39, 0),
    max_priority_fee_per_gas NUMERIC(39, 0),
    max_fee_per_blob_gas NUMERIC(78, 0),
    blob_versioned_hashes TEXT[],
    transaction_type SMALLINT NOT NULL,
    r NUMERIC(78, 0) NOT NULL,
    s NUMERIC(78, 0) NOT NULL,
    v NUMERIC(78, 0) NOT NULL,
    access_list TEXT,
    authorization_list TEXT,
    contract_address TEXT,
    gas_used BIGINT,
    cumulative_gas_used BIGINT,
    effective_gas_price NUMERIC(78, 0),
    blob_gas_used BIGINT,
    blob_gas_price NUMERIC(78, 0),
    logs_bloom TEXT,
    status BIGINT,
    sign SMALLINT DEFAULT 1,
    insert_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    text_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number, hash)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(chain_id, block_timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_block_hash ON transactions(block_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(chain_id, from_address, block_number);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(chain_id, to_address, block_number);
CREATE INDEX IF NOT EXISTS idx_transactions_function_selector ON transactions(function_selector);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    transaction_index BIGINT NOT NULL,
    log_index BIGINT NOT NULL,
    address TEXT NOT NULL,
    data TEXT NOT NULL,
    topic_0 VARCHAR(66),
    topic_1 VARCHAR(66),
    topic_2 VARCHAR(66),
    topic_3 VARCHAR(66),
    insert_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sign SMALLINT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number, transaction_hash, log_index)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for logs table
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(chain_id, block_timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_block_hash ON logs(block_hash);
CREATE INDEX IF NOT EXISTS idx_logs_transaction_hash ON logs(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_logs_address ON logs(chain_id, address, block_number);
CREATE INDEX IF NOT EXISTS idx_logs_topic0 ON logs(chain_id, topic_0, block_number);
CREATE INDEX IF NOT EXISTS idx_logs_topic1 ON logs(chain_id, topic_1, block_number);
CREATE INDEX IF NOT EXISTS idx_logs_topic2 ON logs(chain_id, topic_2, block_number);
CREATE INDEX IF NOT EXISTS idx_logs_topic3 ON logs(chain_id, topic_3, block_number);

-- Traces table
CREATE TABLE IF NOT EXISTS traces (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    transaction_index BIGINT NOT NULL,
    subtraces BIGINT NOT NULL,
    trace_address BIGINT[] NOT NULL,
    type VARCHAR(50) NOT NULL,
    call_type VARCHAR(50),
    error TEXT,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    gas BIGINT NOT NULL,
    gas_used BIGINT NOT NULL,
    input TEXT NOT NULL,
    output TEXT,
    value NUMERIC(78, 0) NOT NULL,
    author TEXT,
    reward_type VARCHAR(50),
    refund_address TEXT,
    sign SMALLINT DEFAULT 1,
    insert_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number, transaction_hash, trace_address)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for traces table
CREATE INDEX IF NOT EXISTS idx_traces_timestamp ON traces(chain_id, block_timestamp);
CREATE INDEX IF NOT EXISTS idx_traces_block_hash ON traces(block_hash);
CREATE INDEX IF NOT EXISTS idx_traces_transaction_hash ON traces(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_traces_from_address ON traces(chain_id, from_address, block_number);
CREATE INDEX IF NOT EXISTS idx_traces_to_address ON traces(chain_id, to_address, block_number);

-- Token balances table
CREATE TABLE IF NOT EXISTS token_balances (
    token_type VARCHAR(50) NOT NULL,
    chain_id NUMERIC(78, 0) NOT NULL,
    owner TEXT NOT NULL,
    address TEXT NOT NULL,
    token_id NUMERIC(78, 0) NOT NULL,
    balance NUMERIC(78, 0) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (token_type, chain_id, owner, address, token_id)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for token_balances table
CREATE INDEX IF NOT EXISTS idx_token_balances_address ON token_balances(token_type, chain_id, address, token_id);

-- Token transfers table
CREATE TABLE IF NOT EXISTS token_transfers (
    token_type VARCHAR(50) NOT NULL,
    chain_id NUMERIC(78, 0) NOT NULL,
    token_address TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    token_id NUMERIC(78, 0) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    log_index BIGINT NOT NULL,
    sign SMALLINT DEFAULT 1,
    insert_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, token_type, token_address, block_number, log_index)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for token_transfers table
CREATE INDEX IF NOT EXISTS idx_token_transfers_from_address ON token_transfers(chain_id, token_type, from_address, block_number, log_index);
CREATE INDEX IF NOT EXISTS idx_token_transfers_to_address ON token_transfers(chain_id, token_type, to_address, block_number, log_index);
CREATE INDEX IF NOT EXISTS idx_token_transfers_transaction_hash ON token_transfers(chain_id, token_type, transaction_hash, block_number, log_index);
CREATE INDEX IF NOT EXISTS idx_token_transfers_timestamp ON token_transfers(chain_id, block_timestamp);

-- Wallet table
CREATE TABLE IF NOT EXISTS wallet (
    address TEXT NOT NULL,
    account_nonce BIGINT,
    balance NUMERIC(78, 0) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (address)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for wallet table
CREATE INDEX IF NOT EXISTS idx_wallet_address ON wallet(address);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at for all tables
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traces_updated_at BEFORE UPDATE ON traces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_balances_updated_at BEFORE UPDATE ON token_balances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_transfers_updated_at BEFORE UPDATE ON token_transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON wallet 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
