-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lì Xì Campaign Table
CREATE TABLE IF NOT EXISTS red_envelope (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount BIGINT NOT NULL, 
    min_amount BIGINT,
    max_amount BIGINT,
    total_claims INT NOT NULL,
    claimed_count INT NOT NULL DEFAULT 0,
    red_envelope_wallet VARCHAR(255),
    owner_wallet VARCHAR(255) NOT NULL,
    creator BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', 
    transaction_hash VARCHAR(255),
    retry_count INT NOT NULL DEFAULT 0,
    
    is_random_distribution BOOLEAN DEFAULT FALSE,
    
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS red_envelope_claim (
    id BIGSERIAL PRIMARY KEY,
    red_envelope_id UUID NOT NULL REFERENCES red_envelope(id),
    claimer_wallet VARCHAR(255) NOT NULL,
    claimer_user_id BIGINT,
    amount BIGINT NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_hash VARCHAR(255), 
    CONSTRAINT unique_claim_per_user UNIQUE (red_envelope_id, claimer_wallet)
);

CREATE TABLE IF NOT EXISTS red_envelope_wallet (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS red_envelope_split_money (
    id BIGSERIAL PRIMARY KEY,
    red_envelope_id UUID NOT NULL REFERENCES red_envelope(id),
    amount BIGINT NOT NULL,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    claim_order INT NOT NULL,
    claimed_by VARCHAR(255),
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for red_envelope table
CREATE INDEX idx_red_envelope_status ON red_envelope(status);
CREATE INDEX idx_red_envelope_creator ON red_envelope(creator);
CREATE INDEX idx_red_envelope_created_at ON red_envelope(created_at DESC);

-- Indexes for red_envelope_claim table
CREATE INDEX idx_red_envelope_claim_campaign ON red_envelope_claim(red_envelope_id);
CREATE INDEX idx_red_envelope_claim_wallet ON red_envelope_claim(claimer_wallet);
CREATE INDEX idx_red_envelope_claim_claimed_at ON red_envelope_claim(claimed_at DESC);

-- Comments for red_envelope table
COMMENT ON TABLE red_envelope IS 'Lì Xì (Red Envelope) campaigns table';
COMMENT ON COLUMN red_envelope.id IS 'Red envelope unique identifier';
COMMENT ON COLUMN red_envelope.name IS 'Red envelope session name';
COMMENT ON COLUMN red_envelope.description IS 'Red envelope session description';
COMMENT ON COLUMN red_envelope.total_amount IS 'Total amount to distribute';
COMMENT ON COLUMN red_envelope.min_amount IS 'Minimum amount per claim (for random distribution)';
COMMENT ON COLUMN red_envelope.max_amount IS 'Maximum amount per claim (for random distribution)';
COMMENT ON COLUMN red_envelope.total_claims IS 'Maximum number of claims allowed';
COMMENT ON COLUMN red_envelope.claimed_count IS 'Number of successful claims so far';
COMMENT ON COLUMN red_envelope.red_envelope_wallet IS 'Intermediate wallet address for holding funds';
COMMENT ON COLUMN red_envelope.owner_wallet IS 'Owner wallet address';
COMMENT ON COLUMN red_envelope.creator IS 'Creator user ID';
COMMENT ON COLUMN red_envelope.status IS 'Status: PENDING=Awaiting transaction confirmation, PUBLISHED=Active and claimable, EXPIRED=Session ended, FAILED=Transaction failed';
COMMENT ON COLUMN red_envelope.transaction_hash IS 'Blockchain transaction hash for funding the red envelope wallet';
COMMENT ON COLUMN red_envelope.retry_count IS 'Number of transaction verification retry attempts';
COMMENT ON COLUMN red_envelope.is_random_distribution IS 'Use random amount distribution';
COMMENT ON COLUMN red_envelope.start_date IS 'Session start date';
COMMENT ON COLUMN red_envelope.end_date IS 'Session end date';
COMMENT ON COLUMN red_envelope.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN red_envelope.updated_at IS 'Record last update timestamp';

-- Comments for red_envelope_claim table
COMMENT ON TABLE red_envelope_claim IS 'Red envelope claims history';
COMMENT ON COLUMN red_envelope_claim.id IS 'Claim unique identifier';
COMMENT ON COLUMN red_envelope_claim.red_envelope_id IS 'Reference to red envelope session';
COMMENT ON COLUMN red_envelope_claim.claimer_wallet IS 'Wallet address of claimer';
COMMENT ON COLUMN red_envelope_claim.claimer_user_id IS 'User ID of claimer (optional)';
COMMENT ON COLUMN red_envelope_claim.amount IS 'Amount claimed';
COMMENT ON COLUMN red_envelope_claim.claimed_at IS 'Claim timestamp';
COMMENT ON COLUMN red_envelope_claim.transaction_hash IS 'Blockchain transaction hash';

-- Add composite indexes for better query performance
CREATE INDEX idx_red_envelope_status_creator ON red_envelope(status, creator);
CREATE INDEX idx_red_envelope_wallet_and_status ON red_envelope(red_envelope_wallet, status);
CREATE INDEX idx_red_envelope_owner_status ON red_envelope(owner_wallet, status);

-- Add index for claim queries with status filter
CREATE INDEX idx_red_envelope_claim_envelope_wallet ON red_envelope_claim(red_envelope_id, claimer_wallet);

-- Add partial index for active sessions only (more efficient)
CREATE INDEX idx_red_envelope_active ON red_envelope(id) WHERE status = 'PUBLISHED';

-- Indexes for red_envelope_wallet table
CREATE INDEX idx_red_envelope_wallet_status ON red_envelope_wallet(status);
CREATE INDEX idx_red_envelope_wallet_created_at ON red_envelope_wallet(created_at);
CREATE INDEX idx_red_envelope_wallet_address ON red_envelope_wallet(wallet_address);

-- Add CHECK constraints for status values
ALTER TABLE red_envelope ADD CONSTRAINT chk_red_envelope_status 
    CHECK (status IN ('PENDING', 'PUBLISHED', 'EXPIRED', 'FAILED'));

ALTER TABLE red_envelope_wallet ADD CONSTRAINT chk_red_envelope_wallet_status 
    CHECK (status IN ('READY', 'IN_USE', 'PREPARE_REPLACE', 'DISABLED'));

-- Comments
COMMENT ON INDEX idx_red_envelope_status_creator IS 'Index for filtering by status and creator';
COMMENT ON INDEX idx_red_envelope_wallet_status IS 'Index for checking wallet status';
COMMENT ON INDEX idx_red_envelope_owner_status IS 'Index for owner wallet queries';
COMMENT ON INDEX idx_red_envelope_wallet_and_status IS 'Index for wallet and status queries';
COMMENT ON INDEX idx_red_envelope_claim_envelope_wallet IS 'Index for claim validation';
COMMENT ON INDEX idx_red_envelope_active IS 'Partial index for active sessions only';

-- Comments for red_envelope_wallet table
COMMENT ON TABLE red_envelope_wallet IS 'Pool of reusable wallet addresses for red envelope sessions';
COMMENT ON COLUMN red_envelope_wallet.id IS 'Wallet pool unique identifier';
COMMENT ON COLUMN red_envelope_wallet.wallet_address IS 'Wallet address (public key)';
COMMENT ON COLUMN red_envelope_wallet.encrypted_private_key IS 'Encrypted private key using AES-256-GCM';
COMMENT ON COLUMN red_envelope_wallet.status IS 'Status: READY=Available for use, IN_USE=Currently assigned, PREPARE_REPLACE=Scheduled for replacement, DISABLED=No longer usable';
COMMENT ON COLUMN red_envelope_wallet.created_at IS 'Wallet creation timestamp';
COMMENT ON COLUMN red_envelope_wallet.updated_at IS 'Wallet last update timestamp';

CREATE INDEX idx_red_envelope_split_money_envelope ON red_envelope_split_money(red_envelope_id);
CREATE INDEX idx_red_envelope_split_money_claim ON red_envelope_split_money(red_envelope_id, is_claimed);
CREATE INDEX idx_red_envelope_split_money_order ON red_envelope_split_money(red_envelope_id, claim_order) WHERE is_claimed = FALSE;

COMMENT ON TABLE red_envelope_split_money IS 'Pre-calculated split amounts for each claim';
COMMENT ON COLUMN red_envelope_split_money.is_claimed IS 'Indicates if this split amount has been claimed';
COMMENT ON COLUMN red_envelope_split_money.claim_order IS 'Sequential order for claiming splits';
COMMENT ON COLUMN red_envelope_split_money.claimed_by IS 'Wallet address that claimed this split';
COMMENT ON COLUMN red_envelope_split_money.claimed_at IS 'Timestamp when this split was claimed';
COMMENT ON COLUMN red_envelope_split_money.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN red_envelope_split_money.updated_at IS 'Record last update timestamp';
