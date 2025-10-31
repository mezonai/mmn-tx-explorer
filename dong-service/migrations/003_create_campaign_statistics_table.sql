-- Create campaign_statistics table for separate statistics tracking
CREATE TABLE IF NOT EXISTS campaign_statistics (
    id SERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    campaign_wallet VARCHAR(255) NOT NULL,
    total_amount BIGINT NOT NULL DEFAULT 0,
    total_contributor INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_campaign_statistics_campaign 
        FOREIGN KEY (campaign_id) REFERENCES donation_campaign(id) ON DELETE CASCADE,
    
    -- Indexes
    CONSTRAINT uk_campaign_statistics_wallet UNIQUE (campaign_wallet),
    CONSTRAINT uk_campaign_statistics_campaign UNIQUE (campaign_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_statistics_wallet ON campaign_statistics (campaign_wallet);
CREATE INDEX IF NOT EXISTS idx_campaign_statistics_campaign_id ON campaign_statistics (campaign_id);

-- Add comments
COMMENT ON TABLE campaign_statistics IS 'Separate table for campaign statistics to avoid locking issues';
COMMENT ON COLUMN campaign_statistics.campaign_id IS 'Reference to donation_campaign.id';
COMMENT ON COLUMN campaign_statistics.campaign_wallet IS 'Campaign wallet address';
COMMENT ON COLUMN campaign_statistics.total_amount IS 'Total amount of donations received';
COMMENT ON COLUMN campaign_statistics.total_contributor IS 'Total number of contributors';
