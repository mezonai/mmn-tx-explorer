-- Create donation_campaign table
CREATE TABLE IF NOT EXISTS donation_campaign (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    goal BIGINT,
    url TEXT,
    end_date TEXT,
    donation_wallet TEXT NOT NULL,
    creator BIGINT NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)), -- 0=Draft, 1=Active, 2=Closed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_donation_campaign_creator ON donation_campaign(creator);
CREATE INDEX IF NOT EXISTS idx_donation_campaign_created_at ON donation_campaign(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_campaign_status_created_at ON donation_campaign(status, created_at DESC);

-- Add comments
COMMENT ON TABLE donation_campaign IS 'Donation campaigns table';
COMMENT ON COLUMN donation_campaign.id IS 'Campaign unique identifier';
COMMENT ON COLUMN donation_campaign.name IS 'Campaign name';
COMMENT ON COLUMN donation_campaign.description IS 'Campaign description';
COMMENT ON COLUMN donation_campaign.goal IS 'Donation goal amount';
COMMENT ON COLUMN donation_campaign.url IS 'Campaign URL';
COMMENT ON COLUMN donation_campaign.end_date IS 'Campaign end date';
COMMENT ON COLUMN donation_campaign.donation_wallet IS 'Wallet address for donations';
COMMENT ON COLUMN donation_campaign.creator IS 'Creator user ID';
COMMENT ON COLUMN donation_campaign.status IS 'Campaign status: 0=Draft, 1=Active, 2=Close';
COMMENT ON COLUMN donation_campaign.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN donation_campaign.updated_at IS 'Record last update timestamp';

