-- Add verified column to donation_campaign
ALTER TABLE IF EXISTS donation_campaign
    ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for the new column
COMMENT ON COLUMN donation_campaign.verified IS 'Whether the campaign is verified';


