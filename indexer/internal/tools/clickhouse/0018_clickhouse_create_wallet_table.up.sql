CREATE TABLE IF NOT EXISTS wallet (
    `address` String,
    `account_nonce` Nullable(UInt64),
    `balance` UInt256 DEFAULT 0,
    `updated_at` DateTime DEFAULT now(),
    INDEX idx_address address TYPE bloom_filter GRANULARITY 1
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (address)
SETTINGS index_granularity = 8192;
