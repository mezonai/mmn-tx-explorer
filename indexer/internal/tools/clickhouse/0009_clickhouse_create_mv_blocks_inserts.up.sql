CREATE MATERIALIZED VIEW IF NOT EXISTS mv_blocks_inserts
TO blocks
AS
SELECT
    chain_id,
    block.1 AS block_number,
    block.2 AS block_timestamp,
    block.3 AS hash,
    block.4 AS parent_hash,
    block.5 AS sha3_uncles,
    block.6 AS nonce,
    block.7 AS mix_hash,
    block.8 AS miner,
    block.9 AS state_root,
    block.10 AS transactions_root,
    block.11 AS receipts_root,
    block.12 AS logs_bloom,
    block.13 AS size,
    block.14 AS extra_data,
    block.15 AS difficulty,
    block.16 AS total_difficulty,
    block.17 AS transaction_count,
    block.18 AS gas_limit,
    block.19 AS gas_used,
    block.20 AS withdrawals_root,
    block.21 AS base_fee_per_gas,
    insert_timestamp,
    sign
FROM inserts_null_table;
