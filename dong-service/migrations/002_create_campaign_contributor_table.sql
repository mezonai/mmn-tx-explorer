-- Create campaign_contributor table
CREATE TABLE IF NOT EXISTS campaign_contributor (
    id BIGSERIAL PRIMARY KEY,
    sender_wallet TEXT NOT NULL,
    campaign_wallet TEXT NOT NULL,
    total_donate BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_sender_campaign UNIQUE (sender_wallet, campaign_wallet)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaign_contributor_sender_wallet ON campaign_contributor(sender_wallet);
CREATE INDEX IF NOT EXISTS idx_campaign_contributor_campaign_wallet ON campaign_contributor(campaign_wallet);
CREATE INDEX IF NOT EXISTS idx_campaign_contributor_top_contributors ON campaign_contributor(campaign_wallet, total_donate DESC);

-- Add comments
COMMENT ON TABLE campaign_contributor IS 'Campaign contributors tracking table';
COMMENT ON COLUMN campaign_contributor.id IS 'Contributor record unique identifier';
COMMENT ON COLUMN campaign_contributor.sender_wallet IS 'Wallet address of the contributor';
COMMENT ON COLUMN campaign_contributor.campaign_wallet IS 'Wallet address of the campaign';
COMMENT ON COLUMN campaign_contributor.total_donate IS 'Total amount donated by this contributor to this campaign';
COMMENT ON COLUMN campaign_contributor.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN campaign_contributor.updated_at IS 'Record last update timestamp';

