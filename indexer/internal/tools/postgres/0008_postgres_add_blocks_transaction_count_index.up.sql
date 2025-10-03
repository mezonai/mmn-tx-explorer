-- Add a combined index for chain_id and transaction_count for better performance
CREATE INDEX IF NOT EXISTS idx_blocks_chain_id_transaction_count ON blocks (chain_id, transaction_count);

