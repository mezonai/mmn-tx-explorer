-- Migration to update campaign related monetary columns to NUMERIC(78,0)
-- and scale the goal column in donation_campaign table

-- 1. Update campaign_contributor table
ALTER TABLE campaign_contributor 
ALTER COLUMN total_donate TYPE NUMERIC(78,0);

-- 2. Update campaign_statistics table
ALTER TABLE campaign_statistics 
ALTER COLUMN total_amount TYPE NUMERIC(78,0),
ALTER COLUMN recent_amount TYPE NUMERIC(78,0),
ALTER COLUMN total_withdrawn TYPE NUMERIC(78,0);

-- 3. Update donation_campaign table
UPDATE donation_campaign 
SET goal = goal * 1000000;

ALTER TABLE donation_campaign 
ALTER COLUMN goal TYPE NUMERIC(78,0);
