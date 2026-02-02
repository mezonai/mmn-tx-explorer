-- ClickHouse migration: Create wallet_stats table
CREATE TABLE IF NOT EXISTS wallet_stats (
    address String,
    total_tx SimpleAggregateFunction(sum, UInt64),
    latest_block SimpleAggregateFunction(max, UInt256)
) ENGINE = AggregatingMergeTree()
ORDER BY address;
