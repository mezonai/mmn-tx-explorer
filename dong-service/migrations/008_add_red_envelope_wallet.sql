CREATE TABLE IF NOT EXISTS red_envelope_wallet (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for red_envelope_wallet table
CREATE INDEX idx_red_envelope_wallet_status ON red_envelope_wallet(status);
CREATE INDEX idx_red_envelope_wallet_created_at ON red_envelope_wallet(created_at);
CREATE INDEX idx_red_envelope_wallet_address ON red_envelope_wallet(wallet_address);

ALTER TABLE red_envelope_wallet ADD CONSTRAINT chk_red_envelope_wallet_status 
    CHECK (status IN ('READY', 'IN_USE', 'PREPARE_REPLACE', 'DISABLED'));
    
-- Comments for red_envelope_wallet table
COMMENT ON TABLE red_envelope_wallet IS 'Pool of reusable wallet addresses for red envelope sessions';
COMMENT ON COLUMN red_envelope_wallet.id IS 'Wallet pool unique identifier';
COMMENT ON COLUMN red_envelope_wallet.wallet_address IS 'Wallet address (public key)';
COMMENT ON COLUMN red_envelope_wallet.encrypted_private_key IS 'Encrypted private key';
COMMENT ON COLUMN red_envelope_wallet.status IS 'Status: READY=Available for use, IN_USE=Currently assigned, PREPARE_REPLACE=Scheduled for replacement, DISABLED=No longer usable';
COMMENT ON COLUMN red_envelope_wallet.created_at IS 'Wallet creation timestamp';
COMMENT ON COLUMN red_envelope_wallet.updated_at IS 'Wallet last update timestamp';

