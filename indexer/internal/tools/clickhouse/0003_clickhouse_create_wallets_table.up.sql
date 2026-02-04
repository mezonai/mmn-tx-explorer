-- ClickHouse migration: Create wallet table

CREATE TABLE IF NOT EXISTS wallets (
    address String,
    account_nonce UInt64,
    balance UInt256,
    updated_at DateTime64(3) DEFAULT now64(3),
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (address);
