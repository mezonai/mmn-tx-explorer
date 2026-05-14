-- Add refund_tx_hash column to red_envelope for tracking refund transactions
ALTER TABLE dong_schema.red_envelope
    ADD COLUMN IF NOT EXISTS refund_tx_hash VARCHAR(255);
