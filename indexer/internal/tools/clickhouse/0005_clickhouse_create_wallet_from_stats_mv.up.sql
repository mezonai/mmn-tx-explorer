-- ClickHouse migration: Create wallet_from_stats_mv materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS wallet_from_stats_mv TO wallet_stats AS
SELECT 
    from_address AS address,
    count() AS total_tx,
    max(block_number) AS latest_block
FROM transactions
GROUP BY address;
