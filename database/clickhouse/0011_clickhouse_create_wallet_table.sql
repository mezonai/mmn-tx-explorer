CREATE TABLE IF NOT EXISTS wallet (
    `address` FixedString(64),
    `balance` UInt64 DEFAULT 0,
    `created_at` DateTime DEFAULT now(),
    `updated_at` DateTime DEFAULT now(),
    INDEX idx_address address TYPE bloom_filter GRANULARITY 1,
    INDEX idx_created_at created_at TYPE minmax GRANULARITY 3
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (address)
PARTITION BY toYYYYMM(created_at)
SETTINGS index_granularity = 8192;