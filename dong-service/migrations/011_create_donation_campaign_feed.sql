CREATE TABLE IF NOT EXISTS user_content (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    creator_address TEXT NOT NULL,
    campaign_address TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_cids TEXT[],
    parent_hash VARCHAR(66),
    root_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_feed_campaign_address ON user_content (campaign_address);
CREATE INDEX IF NOT EXISTS idx_campaign_feed_created_at ON user_content (created_at DESC);