CREATE TABLE IF NOT EXISTS wallet (
    `address` String,
    `account_nonce` Nullable(UInt64),
    `balance` UInt64 DEFAULT 0,
    `tx_timestamp` DateTime,
    INDEX idx_address address TYPE bloom_filter GRANULARITY 1
) ENGINE = ReplacingMergeTree(tx_timestamp)
ORDER BY (address)
SETTINGS index_granularity = 8192;
