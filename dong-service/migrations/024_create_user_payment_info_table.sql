CREATE TABLE IF NOT EXISTS user_payment_info (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, bank_name),
    UNIQUE(bank_name, account_number)
);

CREATE INDEX IF NOT EXISTS idx_user_payment_info_user_id ON user_payment_info (user_id);
