CREATE TABLE IF NOT EXISTS token_balances
(
  `token_type` String,
  `chain_id` UInt256,
  `owner` FixedString(64),
  `address` FixedString(64),
  `token_id` UInt256,
  `balance` Int256,
  PROJECTION address_projection
    (
        SELECT *
        ORDER BY 
            token_type,
            chain_id,
            address,
            token_id
    )
)
ENGINE = SummingMergeTree
ORDER BY (token_type, chain_id, owner, address, token_id)
SETTINGS index_granularity = 8192, lightweight_mutation_projection_mode = 'rebuild', deduplicate_merge_projection_mode = 'rebuild';
