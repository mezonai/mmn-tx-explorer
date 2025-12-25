-- Partition blocks and transactions by timestamp (monthly ranges)
-- This migration converts existing tables to partitioned tables using block_timestamp and transaction_timestamp

-- Create new partitioned blocks table
CREATE TABLE IF NOT EXISTS blocks_new (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    hash VARCHAR(66) NOT NULL,
    parent_hash VARCHAR(66) NOT NULL,
    transaction_count BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT blocks_new_pkey PRIMARY KEY (chain_id, block_number, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

-- Create new partitioned transactions table
CREATE TABLE IF NOT EXISTS transactions_new (
    chain_id NUMERIC(78, 0) NOT NULL,
    hash VARCHAR(66) NOT NULL,
    nonce BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT,
    value NUMERIC(78, 0) NOT NULL,
    transaction_type SMALLINT NOT NULL,
    status BIGINT,
    transaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    text_data TEXT,
    extra_info TEXT,
    transaction_extra_info_type transaction_extra_info_type_enum DEFAULT 'token-transfer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT transactions_new_pkey PRIMARY KEY (chain_id, block_number, hash, transaction_timestamp)
) PARTITION BY RANGE (transaction_timestamp);

-- Install required extensions
CREATE SCHEMA IF NOT EXISTS partman;

DO $$
DECLARE
    existing_schema text;
BEGIN
    SELECT extnamespace::regnamespace::text
    INTO existing_schema
    FROM pg_extension
    WHERE extname = 'pg_partman';

    IF existing_schema IS NOT NULL AND existing_schema <> 'partman' THEN
        EXECUTE 'DROP EXTENSION IF EXISTS pg_partman CASCADE';
    END IF;
END
$$;

CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA partman;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Configure pg_partman for blocks_new table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM partman.part_config WHERE parent_table = 'public.blocks_new'
    ) THEN
        PERFORM partman.create_parent(
            p_parent_table => 'public.blocks_new',
            p_control => 'block_timestamp',
            p_interval => '1 month',
            p_premake => 24,
            p_start_partition => '2024-01-01'
        );
    END IF;
END
$$;

-- Configure pg_partman for transactions_new table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM partman.part_config WHERE parent_table = 'public.transactions_new'
    ) THEN
        PERFORM partman.create_parent(
            p_parent_table => 'public.transactions_new',
            p_control => 'transaction_timestamp',
            p_interval => '1 month',
            p_premake => 24,
            p_start_partition => '2024-01-01'
        );
    END IF;
END
$$;

-- Ensure partitions are created indefinitely
UPDATE partman.part_config
SET infinite_time_partitions = true,
    retention = NULL,
    retention_keep_table = true
WHERE parent_table IN ('public.blocks_new', 'public.transactions_new');

-- Backfill data
INSERT INTO blocks_new (chain_id, block_number, block_timestamp, hash, parent_hash, transaction_count, created_at, updated_at)
SELECT chain_id, block_number, block_timestamp, hash, parent_hash, transaction_count, created_at, updated_at
FROM blocks;

INSERT INTO transactions_new (
    chain_id, hash, nonce, block_hash, block_number, from_address, to_address,
    value, transaction_type, status, transaction_timestamp, text_data,
    extra_info, transaction_extra_info_type, created_at, updated_at
)
SELECT
    chain_id, hash, nonce, block_hash, block_number, from_address, to_address,
    value, transaction_type, status, transaction_timestamp, text_data,
    extra_info, transaction_extra_info_type, created_at, updated_at
FROM transactions;

-- Swap tables
ALTER TABLE blocks RENAME TO blocks_old;
ALTER TABLE transactions RENAME TO transactions_old;

ALTER TABLE blocks_new RENAME TO blocks;
ALTER TABLE transactions_new RENAME TO transactions;

-- Rename old constraints/indexes to free names for new tables
ALTER TABLE blocks_old RENAME CONSTRAINT blocks_pkey TO blocks_pkey_old;
ALTER TABLE transactions_old RENAME CONSTRAINT transactions_pkey TO transactions_pkey_old;

ALTER INDEX IF EXISTS idx_blocks_chain_id_transaction_count RENAME TO idx_blocks_chain_id_transaction_count_old;

ALTER INDEX IF EXISTS idx_transactions_block_hash RENAME TO idx_transactions_block_hash_old;
ALTER INDEX IF EXISTS idx_transactions_hash RENAME TO idx_transactions_hash_old;
ALTER INDEX IF EXISTS idx_transactions_only_from_address RENAME TO idx_transactions_only_from_address_old;
ALTER INDEX IF EXISTS idx_transactions_only_to_address RENAME TO idx_transactions_only_to_address_old;
ALTER INDEX IF EXISTS idx_transactions_only_transaction_timestamp RENAME TO idx_transactions_only_transaction_timestamp_old;
ALTER INDEX IF EXISTS idx_transactions_from_address_timestamp RENAME TO idx_transactions_from_address_timestamp_old;
ALTER INDEX IF EXISTS idx_transactions_to_address_timestamp RENAME TO idx_transactions_to_address_timestamp_old;
ALTER INDEX IF EXISTS idx_transactions_block_number_timestamp RENAME TO idx_transactions_block_number_timestamp_old;
ALTER INDEX IF EXISTS idx_transactions_timestamp_hash RENAME TO idx_transactions_timestamp_hash_old;
ALTER INDEX IF EXISTS idx_transaction_extra_info_type_status RENAME TO idx_transaction_extra_info_type_status_old;

-- Rename new constraints to canonical names
ALTER TABLE blocks RENAME CONSTRAINT blocks_new_pkey TO blocks_pkey;
ALTER TABLE transactions RENAME CONSTRAINT transactions_new_pkey TO transactions_pkey;

-- Update pg_partman config to follow renamed tables
UPDATE partman.part_config
SET parent_table = 'public.blocks'
WHERE parent_table = 'public.blocks_new';

UPDATE partman.part_config
SET parent_table = 'public.transactions'
WHERE parent_table = 'public.transactions_new';

-- Recreate triggers on new tables
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate indexes on new tables
CREATE INDEX IF NOT EXISTS idx_blocks_chain_id_transaction_count ON blocks(chain_id, transaction_count);
CREATE INDEX IF NOT EXISTS idx_transactions_block_hash ON transactions(block_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_only_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_only_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_only_transaction_timestamp ON transactions(transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address_timestamp ON transactions(from_address, transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address_timestamp ON transactions(to_address, transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_block_number_timestamp ON transactions(block_number, transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_hash ON transactions(transaction_timestamp DESC, hash DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_extra_info_type_status ON transactions(transaction_extra_info_type, status);
