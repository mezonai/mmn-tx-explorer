-- ClickHouse migration: Create wallet_to_stats_mv materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS wallet_to_stats_mv TO wallet_stats AS
SELECT 
    to_address AS address,
    count() AS total_tx,
    max(block_number) AS latest_block
FROM transactions
GROUP BY address;
