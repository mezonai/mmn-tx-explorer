-- Add recent_amount column to campaign_statistics to store most recent donations window
ALTER TABLE IF EXISTS campaign_statistics
ADD COLUMN IF NOT EXISTS recent_amount BIGINT DEFAULT 0;

COMMENT ON COLUMN campaign_statistics.recent_amount IS 'Aggregated donation amount within configured lookback window (e.g. last 7 days)';
