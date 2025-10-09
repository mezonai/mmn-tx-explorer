-- Remove unused columns from transactions table to match simplified Transaction struct
-- Keep only: chain_id, hash, nonce, block_hash, block_number, from_address, to_address, 
-- transaction_timestamp, value, transaction_type, status, text_data, extra_info

ALTER TABLE transactions 
DROP COLUMN IF EXISTS block_timestamp,
DROP COLUMN IF EXISTS transaction_index,
DROP COLUMN IF EXISTS gas,
DROP COLUMN IF EXISTS gas_price,
DROP COLUMN IF EXISTS data,
DROP COLUMN IF EXISTS function_selector,
DROP COLUMN IF EXISTS max_fee_per_gas,
DROP COLUMN IF EXISTS max_priority_fee_per_gas,
DROP COLUMN IF EXISTS max_fee_per_blob_gas,
DROP COLUMN IF EXISTS blob_versioned_hashes,
DROP COLUMN IF EXISTS r,
DROP COLUMN IF EXISTS s,
DROP COLUMN IF EXISTS v,
DROP COLUMN IF EXISTS access_list,
DROP COLUMN IF EXISTS authorization_list,
DROP COLUMN IF EXISTS contract_address,
DROP COLUMN IF EXISTS gas_used,
DROP COLUMN IF EXISTS cumulative_gas_used,
DROP COLUMN IF EXISTS effective_gas_price,
DROP COLUMN IF EXISTS blob_gas_used,
DROP COLUMN IF EXISTS blob_gas_price,
DROP COLUMN IF EXISTS logs_bloom,
DROP COLUMN IF EXISTS insert_timestamp,
DROP COLUMN IF EXISTS sign;
