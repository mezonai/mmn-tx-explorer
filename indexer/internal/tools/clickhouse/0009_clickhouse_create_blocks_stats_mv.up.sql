-- ClickHouse migration: Create blocks_stats_mv materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS blocks_stats_mv TO network_summary AS
SELECT 
    'total_blocks' AS metric_name,
    sumState(CAST(1 AS UInt64)) AS sum_value,
    uniqState(CAST('' AS String)) AS uniq_value -- Placeholder for unused column
FROM blocks;
