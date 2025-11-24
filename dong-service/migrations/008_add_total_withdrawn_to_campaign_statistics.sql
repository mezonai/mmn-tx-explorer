-- Add total_withdrawn column to campaign_statistics table
ALTER TABLE campaign_statistics 
ADD COLUMN IF NOT EXISTS total_withdrawn BIGINT DEFAULT 0;

-- Add comment for the new column
COMMENT ON COLUMN campaign_statistics.total_withdrawn IS 'Total amount withdrawn from the campaign';

-- Backfill existing records with calculated total_withdrawn
UPDATE dong_schema.campaign_statistics cs
SET total_withdrawn = GREATEST(cs.total_amount - COALESCE(w.balance, 0), 0)
FROM dong_schema.donation_campaign dc
LEFT JOIN indexer.wallet w ON w.address = dc.donation_wallet
WHERE cs.campaign_id = dc.id
  AND cs.total_withdrawn = 0;