-- Add owner column to donation_campaign table
ALTER TABLE donation_campaign 
ADD COLUMN owner VARCHAR(255);

-- Add comment for the new column
COMMENT ON COLUMN donation_campaign.owner IS 'Campaign owner/partner information';
