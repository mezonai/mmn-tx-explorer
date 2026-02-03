-- Change type to NUMERIC(78,0) and scale amounts by 1,000,000 for red_envelope tables

-- Update red_envelope table
ALTER TABLE red_envelope
    ALTER COLUMN total_amount TYPE NUMERIC(78,0) USING (total_amount::NUMERIC * 1000000),
    ALTER COLUMN min_amount   TYPE NUMERIC(78,0) USING (min_amount::NUMERIC * 1000000),
    ALTER COLUMN max_amount   TYPE NUMERIC(78,0) USING (max_amount::NUMERIC * 1000000);

-- Update red_envelope_claim table
ALTER TABLE red_envelope_claim
    ALTER COLUMN amount TYPE NUMERIC(78,0) USING (amount::NUMERIC * 1000000);

-- Update red_envelope_split_money table
ALTER TABLE red_envelope_split_money
    ALTER COLUMN amount TYPE NUMERIC(78,0) USING (amount::NUMERIC * 1000000);
