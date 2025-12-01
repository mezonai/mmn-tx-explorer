CREATE TABLE IF NOT EXISTS donation_campaign_feed (
    id BIGSERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    owner_address TEXT NOT NULL,
    campaign_address TEXT NOT NULL,
    extra_info JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_feed_campaign_address ON donation_campaign_feed (campaign_address);
CREATE INDEX IF NOT EXISTS idx_campaign_feed_transaction_timestamp ON donation_campaign_feed (created_at DESC);

-- extra_info:
-- {
--   "title": "Tiến độ xây trường tháng 12",
--   "description": "Đã hoàn thành phần móng, chuẩn bị xây tường.",
--   "image_cids": [
--     "bafybeia123...",
--     "bafybeib456..."
--   ]
-- }