-- ClickHouse migration: Create mv_wallets_stats materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS wallets_stats_mv TO network_summary AS
SELECT 
    'total_wallets' AS metric_name,
    sumState(CAST(0 AS UInt64)) AS sum_value, -- Placeholder
    uniqState(address) AS uniq_value
FROM wallets;
