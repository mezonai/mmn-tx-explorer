-- CREATE TABLE IF NOT EXISTS intermediary_wallet (
--     id BIGSERIAL PRIMARY KEY,
--     wallet_address VARCHAR(255) NOT NULL UNIQUE,
--     encrypted_private_key TEXT NOT NULL,
--     type VARCHAR(20) NOT NULL DEFAULT 'DEFAULT',
--     status VARCHAR(20) NOT NULL DEFAULT 'READY',
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- -- Indexes for intermediary_wallet table
-- CREATE INDEX idx_intermediary_wallet_status ON intermediary_wallet(status);
-- CREATE INDEX idx_intermediary_wallet_status_created_at ON intermediary_wallet(status, created_at);
-- CREATE INDEX idx_intermediary_wallet_address ON intermediary_wallet(wallet_address);

-- ALTER TABLE intermediary_wallet ADD CONSTRAINT chk_intermediary_wallet_status 
--     CHECK (status IN ('READY', 'IN_USE', 'PREPARE_REPLACE', 'DISABLED'));

-- ALTER TABLE intermediary_wallet ADD CONSTRAINT chk_intermediary_wallet_type
--     CHECK (type IN ('DEFAULT', 'LUCKY_MONEY'));
    
-- -- Comments for intermediary_wallet table
-- COMMENT ON TABLE intermediary_wallet IS 'Pool of reusable wallet addresses for red envelope sessions';
-- COMMENT ON COLUMN intermediary_wallet.id IS 'Wallet pool unique identifier';
-- COMMENT ON COLUMN intermediary_wallet.wallet_address IS 'Wallet address (public key)';
-- COMMENT ON COLUMN intermediary_wallet.encrypted_private_key IS 'Encrypted private key';
-- COMMENT ON COLUMN intermediary_wallet.type IS 'Wallet type';
-- COMMENT ON COLUMN intermediary_wallet.status IS 'Status: READY=Available for use, IN_USE=Currently assigned, PREPARE_REPLACE=Scheduled for replacement, DISABLED=No longer usable';
-- COMMENT ON COLUMN intermediary_wallet.created_at IS 'Wallet creation timestamp';
-- COMMENT ON COLUMN intermediary_wallet.updated_at IS 'Wallet last update timestamp';

