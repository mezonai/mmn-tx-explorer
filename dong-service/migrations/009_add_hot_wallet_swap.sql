CREATE TABLE IF NOT EXISTS hot_wallet_swap (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE hot_wallet_swap IS 'Hot wallet addresses for hot wallet swaps';
COMMENT ON COLUMN hot_wallet_swap.id IS 'Wallet pool unique identifier';
COMMENT ON COLUMN hot_wallet_swap.wallet_address IS 'Wallet address (public key)';
COMMENT ON COLUMN hot_wallet_swap.encrypted_private_key IS 'Encrypted private key';
COMMENT ON COLUMN hot_wallet_swap.created_at IS 'Wallet creation timestamp';

CREATE TABLE IF NOT EXISTS hot_wallet_history (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    receive_wallet_address VARCHAR(255) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    amount VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE hot_wallet_history IS 'History of hot wallet swaps';
COMMENT ON COLUMN hot_wallet_history.id IS 'History unique identifier';
COMMENT ON COLUMN hot_wallet_history.user_id IS 'User ID who performed the swap';
COMMENT ON COLUMN hot_wallet_history.receive_wallet_address IS 'Recipient wallet address';
COMMENT ON COLUMN hot_wallet_history.tx_hash IS 'Transaction hash of the swap';
COMMENT ON COLUMN hot_wallet_history.amount IS 'Amount swapped';
COMMENT ON COLUMN hot_wallet_history.created_at IS 'Swap timestamp';

CREATE INDEX idx_hot_wallet_history_tx_hash ON hot_wallet_history (tx_hash);
CREATE INDEX idx_hot_wallet_history_receive_wallet ON hot_wallet_history (receive_wallet_address);
CREATE INDEX idx_hot_wallet_history_user_id ON hot_wallet_history (user_id);
CREATE INDEX idx_hot_wallet_history_created_at ON hot_wallet_history (created_at);
CREATE INDEX idx_hot_wallet_history_user_date ON hot_wallet_history (user_id, created_at);
