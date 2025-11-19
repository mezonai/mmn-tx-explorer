-- Alter text columns to VARCHAR(255) for better performance and constraints
ALTER TABLE donation_campaign 
ALTER COLUMN name TYPE VARCHAR(255);

ALTER TABLE donation_campaign 
ALTER COLUMN donation_wallet TYPE VARCHAR(255);

ALTER TABLE donation_campaign 
ALTER COLUMN url TYPE VARCHAR(255);

-- Update comments to reflect the new column types
COMMENT ON COLUMN donation_campaign.name IS 'Campaign name (max 255 characters)';
COMMENT ON COLUMN donation_campaign.donation_wallet IS 'Wallet address for donations (max 255 characters)';
COMMENT ON COLUMN donation_campaign.url IS 'Campaign banner URL (max 255 characters)';
