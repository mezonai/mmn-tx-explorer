CREATE TABLE IF NOT EXISTS token_transfers
(
    `token_type` LowCardinality(String),
    `chain_id` UInt256,
    `token_address` FixedString(64),
    `from_address` FixedString(64),
    `to_address` FixedString(64),
    `block_number` UInt256,
    `block_timestamp` DateTime CODEC(Delta(4), ZSTD(1)),
    `transaction_hash` FixedString(66),
    `token_id` UInt256,
    `amount` UInt256,
    `log_index` UInt64,
    `sign` Int8 DEFAULT 1,
    `insert_timestamp` DateTime DEFAULT now(),

    INDEX minmax_block_number block_number TYPE minmax GRANULARITY 16,
    INDEX minmax_block_timestamp block_timestamp TYPE minmax GRANULARITY 16,

    PROJECTION from_address_projection
    (
        SELECT *
        ORDER BY 
            chain_id,
            token_type,
            from_address,
            block_number,
            log_index
    ),
    PROJECTION to_address_projection
    (
        SELECT *
        ORDER BY 
            chain_id,
            token_type,
            to_address,
            block_number,
            log_index
    ),
    PROJECTION transaction_hash_projection
    (
        SELECT *
        ORDER BY 
            chain_id,
            token_type,
            transaction_hash,
            block_number,
            log_index
    ),
    PROJECTION token_aggregation_projection
    (
        SELECT 
            chain_id,
            token_type,
            max(block_number) AS max_block_number,
            count() AS total_count
        GROUP BY 
            chain_id,
            token_type
    )
)
ENGINE = VersionedCollapsingMergeTree(sign, insert_timestamp)
PARTITION BY chain_id
ORDER BY (chain_id, token_type, token_address, block_number, log_index)
SETTINGS index_granularity = 8192, lightweight_mutation_projection_mode = 'rebuild', deduplicate_merge_projection_mode = 'rebuild';
