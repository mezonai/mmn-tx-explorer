-- Delete red_envelope_split_money table (no longer needed)
-- DROP TABLE IF EXISTS red_envelope_split_money;

-- Add status column to red_envelope_claim table for tracking claim status
-- Default to SUCCESS for backward compatibility with existing records
ALTER TABLE red_envelope_claim 
ADD COLUMN status VARCHAR(20) DEFAULT 'SUCCESS' NOT NULL;