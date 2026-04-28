CREATE INDEX IF NOT EXISTS idx_red_envelope_claim_envelope_status
    ON red_envelope_claim (red_envelope_id, status);

ALTER TABLE red_envelope_claim
    DROP CONSTRAINT IF EXISTS unique_claim_per_user;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_claim_per_user
    ON red_envelope_claim (red_envelope_id, claimer_wallet)
    WHERE status <> 'FAILED';
