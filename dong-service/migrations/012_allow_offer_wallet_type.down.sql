-- Revert: remove OFFER from intermediary_wallet.type constraint
BEGIN;
-- Ensure no rows will violate the new (stricter) constraint by mapping OFFER -> DEFAULT
UPDATE intermediary_wallet SET type = 'DEFAULT' WHERE type = 'OFFER';

ALTER TABLE intermediary_wallet DROP CONSTRAINT IF EXISTS chk_intermediary_wallet_type;
ALTER TABLE intermediary_wallet
    ADD CONSTRAINT chk_intermediary_wallet_type
    CHECK (type IN ('DEFAULT','LUCKY_MONEY'));
COMMIT;
