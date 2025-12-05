-- Add OFFER to intermediary_wallet.type constraint
BEGIN;
ALTER TABLE intermediary_wallet DROP CONSTRAINT IF EXISTS chk_intermediary_wallet_type;
ALTER TABLE intermediary_wallet
    ADD CONSTRAINT chk_intermediary_wallet_type
    CHECK (type IN ('DEFAULT','LUCKY_MONEY','OFFER'));
COMMIT;
