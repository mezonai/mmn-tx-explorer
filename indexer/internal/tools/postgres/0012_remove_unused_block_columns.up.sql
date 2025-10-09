-- Remove unused columns from blocks table to match simplified Block struct
-- Keep only: chain_id, block_number, hash, parent_hash, block_timestamp, transaction_count

ALTER TABLE blocks 
DROP COLUMN IF EXISTS sha3_uncles,
DROP COLUMN IF EXISTS nonce,
DROP COLUMN IF EXISTS mix_hash,
DROP COLUMN IF EXISTS miner,
DROP COLUMN IF EXISTS state_root,
DROP COLUMN IF EXISTS transactions_root,
DROP COLUMN IF EXISTS receipts_root,
DROP COLUMN IF EXISTS logs_bloom,
DROP COLUMN IF EXISTS size,
DROP COLUMN IF EXISTS extra_data,
DROP COLUMN IF EXISTS difficulty,
DROP COLUMN IF EXISTS total_difficulty,
DROP COLUMN IF EXISTS gas_limit,
DROP COLUMN IF EXISTS gas_used,
DROP COLUMN IF EXISTS withdrawals_root,
DROP COLUMN IF EXISTS base_fee_per_gas,
DROP COLUMN IF EXISTS sign,
DROP COLUMN IF EXISTS insert_timestamp;
