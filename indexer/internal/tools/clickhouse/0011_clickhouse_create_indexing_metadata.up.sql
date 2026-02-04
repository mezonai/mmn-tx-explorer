-- ClickHouse migration: Create indexing_metadata table

CREATE TABLE IF NOT EXISTS indexing_metadata (
    chain_id UInt256,
    max_synced_block UInt256,
    updated_at DateTime64(3) DEFAULT now64(3)
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (chain_id);
