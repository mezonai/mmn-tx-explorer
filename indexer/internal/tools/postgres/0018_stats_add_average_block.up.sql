-- Add average_block key to stats table with initial calculation
-- This calculates the average block time over the last 100 blocks (or fewer if not enough blocks)
-- and stores it in milliseconds as required by the BIGINT column type

INSERT INTO stats(key, value)
WITH block_data AS (
    SELECT 
        block_number,
        EXTRACT(EPOCH FROM block_timestamp)::BIGINT AS timestamp_sec
    FROM blocks
    ORDER BY block_number DESC
    LIMIT 100
),
latest AS (
    SELECT 
        block_number AS latest_number,
        timestamp_sec AS latest_timestamp
    FROM block_data
    ORDER BY block_number DESC
    LIMIT 1
),
oldest AS (
    SELECT 
        block_number AS oldest_number,
        timestamp_sec AS oldest_timestamp
    FROM block_data
    ORDER BY block_number ASC
    LIMIT 1
),
calc AS (
    SELECT
        latest.latest_number,
        latest.latest_timestamp,
        oldest.oldest_number,
        oldest.oldest_timestamp,
        CASE
            WHEN latest.latest_number = oldest.oldest_number THEN 0
            WHEN latest.latest_timestamp <= oldest.oldest_timestamp THEN 0
            ELSE (latest.latest_timestamp - oldest.oldest_timestamp)::FLOAT / (latest.latest_number - oldest.oldest_number)::FLOAT * 1000
        END AS avg_block_time_ms
    FROM latest CROSS JOIN oldest
)
SELECT 
    'average_block',
    CAST(COALESCE(avg_block_time_ms, 0) AS BIGINT)
FROM calc
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
