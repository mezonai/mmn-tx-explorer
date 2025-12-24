ALTER TABLE user_content
ADD COLUMN IF NOT EXISTS reference_tx_hashes TEXT[];