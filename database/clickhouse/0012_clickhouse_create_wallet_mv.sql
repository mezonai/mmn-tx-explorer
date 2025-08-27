CREATE MATERIALIZED VIEW IF NOT EXISTS wallet_addresses_mv TO wallet AS
SELECT address,
    account_nonce,
    balance,
    tx_timestamp
FROM (
        SELECT sender_account.1 as address,
            sender_account.3 as account_nonce,
            sender_account.2 as balance,
            transaction_timestamp as tx_timestamp
        FROM transactions
        WHERE sender_account.1 != ''
        UNION ALL
        SELECT receiver_account.1 as address,
            receiver_account.3 as account_nonce,
            receiver_account.2 as balance,
            transaction_timestamp as tx_timestamp
        FROM transactions
        WHERE receiver_account.1 != ''
    )
WHERE address != '';