-- Add total_withdrawn column to campaign_statistics table
ALTER TABLE campaign_statistics 
ADD COLUMN IF NOT EXISTS total_withdrawn BIGINT DEFAULT 0;

-- Add comment for the new column
COMMENT ON COLUMN campaign_statistics.total_withdrawn IS 'Total amount withdrawn from the campaign';
