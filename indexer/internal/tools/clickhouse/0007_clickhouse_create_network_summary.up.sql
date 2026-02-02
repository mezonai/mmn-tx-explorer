-- ClickHouse migration: Create network_summary table
CREATE TABLE IF NOT EXISTS network_summary (
    metric_name String,
    sum_value AggregateFunction(sum, UInt64),
    uniq_value AggregateFunction(uniq, String)
) ENGINE = AggregatingMergeTree()
ORDER BY metric_name;
