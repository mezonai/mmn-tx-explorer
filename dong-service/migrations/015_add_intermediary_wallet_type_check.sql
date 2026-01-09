-- Add a CHECK constraint to ensure intermediary_wallet.type is one of the allowed values
ALTER TABLE intermediary_wallet
DROP CONSTRAINT chk_intermediary_wallet_type;

ALTER TABLE intermediary_wallet
ADD CONSTRAINT chk_intermediary_wallet_type
CHECK (type IN ('DEFAULT', 'LUCKY_MONEY', 'OFFER'));