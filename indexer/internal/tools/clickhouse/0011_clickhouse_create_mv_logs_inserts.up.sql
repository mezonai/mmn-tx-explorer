CREATE MATERIALIZED VIEW IF NOT EXISTS mv_logs_inserts
TO logs
AS
SELECT
    chain_id,
    l.1 AS block_number,
    l.2 AS block_hash,
    l.3 AS block_timestamp,
    l.4 AS transaction_hash,
    l.5 AS transaction_index,
    l.6 AS log_index,
    l.7 AS address,
    l.8 AS data,
    l.9 AS topic_0,
    l.10 AS topic_1,
    l.11 AS topic_2,
    l.12 AS topic_3,
    insert_timestamp,
    sign
FROM inserts_null_table
ARRAY JOIN logs AS l;
