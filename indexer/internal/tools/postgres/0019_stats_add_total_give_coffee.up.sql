-- Seed stats table with total_give_coffee count (robust: ILIKE to tolerate malformed JSON)
INSERT INTO stats(key, value)
VALUES (
    'total_give_coffee',
    (
          SELECT COUNT(*) FROM transactions
          WHERE transaction_type = 0
    )
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
