-- Add CHECK constraint on red_envelope.status
ALTER TABLE dong_schema.red_envelope DROP CONSTRAINT IF EXISTS chk_red_envelope_status;

ALTER TABLE dong_schema.red_envelope ADD CONSTRAINT chk_red_envelope_status
    CHECK (status IN ('PENDING', 'PUBLISHED', 'EXPIRED', 'FAILED', 'CLOSED'));

-- Add CHECK constraint on red_envelope_claim.status
ALTER TABLE dong_schema.red_envelope_claim DROP CONSTRAINT IF EXISTS chk_red_envelope_claim_status;
ALTER TABLE dong_schema.red_envelope_claim
    ADD CONSTRAINT chk_red_envelope_claim_status
    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'));

-- Add composite index on (red_envelope_id, status) for efficient filtering
-- Used by GetTotalClaimedAmount: WHERE red_envelope_id = $1 AND status = 'SUCCESS'
CREATE INDEX IF NOT EXISTS idx_red_envelope_claim_envelope_status
    ON dong_schema.red_envelope_claim(red_envelope_id, status);
