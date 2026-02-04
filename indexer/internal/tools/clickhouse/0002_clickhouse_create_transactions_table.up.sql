-- ClickHouse migration: Create transactions table

CREATE TABLE IF NOT EXISTS transactions (
    chain_id UInt256,
    hash String,
    nonce UInt64,
    block_hash String,
    block_number UInt256,
    from_address String,
    to_address String,
    value UInt256,
    transaction_type UInt8,
    status UInt64,
    transaction_timestamp DateTime64(3),
    text_data String,
    extra_info String,
    transaction_extra_info_type String,
    created_at DateTime64(3) DEFAULT now64(3),
    updated_at DateTime64(3) DEFAULT now64(3),
    
    -- Secondary Index for Hash Lookup (Bloom Filter)
    INDEX idx_hash hash TYPE bloom_filter(0.01) GRANULARITY 1,
    
    -- Projection for From Address filtering
    PROJECTION proj_from_address (
        SELECT * ORDER BY chain_id, from_address, transaction_timestamp
    ),
    -- Projection for To Address filtering
    PROJECTION proj_to_address (
        SELECT * ORDER BY chain_id, to_address, transaction_timestamp
    )
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (chain_id, block_number, hash)
SETTINGS deduplicate_merge_projection_mode = 'rebuild';
