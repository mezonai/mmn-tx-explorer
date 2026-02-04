-- ClickHouse migration: Create blocks table

CREATE TABLE IF NOT EXISTS blocks (
    chain_id UInt256,
    block_number UInt256,
    hash String,
    parent_hash String,
    block_timestamp DateTime64(3),
    transaction_count UInt64,
    created_at DateTime64(3) DEFAULT now64(3),
    updated_at DateTime64(3) DEFAULT now64(3),
    -- Bloom Filter for Hash lookup (0.01 false positive rate)
    INDEX idx_hash hash TYPE bloom_filter(0.01) GRANULARITY 1
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (chain_id, block_number);
