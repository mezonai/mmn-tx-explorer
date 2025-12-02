-- Seed stats table with total_give_coffee count (robust: ILIKE to tolerate malformed JSON)
INSERT INTO stats(key, value)
VALUES (
    'total_give_coffee',
    (
          SELECT COUNT(*) FROM transactions
          WHERE transaction_extra_info_type = 'give-coffee' AND status = 2
    )
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
