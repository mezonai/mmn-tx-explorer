CREATE MATERIALIZED VIEW IF NOT EXISTS mv_traces_inserts
TO traces
AS
SELECT
    chain_id,
    tr.1 AS block_number,
    tr.2 AS block_hash,
    tr.3 AS block_timestamp,
    tr.4 AS transaction_hash,
    tr.5 AS transaction_index,
    tr.6 AS subtraces,
    tr.7 AS trace_address,
    tr.8 AS type,
    tr.9 AS call_type,
    tr.10 AS error,
    tr.11 AS from_address,
    tr.12 AS to_address,
    tr.13 AS gas,
    tr.14 AS gas_used,
    tr.15 AS input,
    tr.16 AS output,
    tr.17 AS value,
    tr.18 AS author,
    tr.19 AS reward_type,
    tr.20 AS refund_address,
    insert_timestamp,
    sign
FROM inserts_null_table
ARRAY JOIN traces AS tr;
