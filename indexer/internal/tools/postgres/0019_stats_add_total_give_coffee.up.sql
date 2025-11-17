-- Seed stats table with total_give_coffee count (robust: ILIKE to tolerate malformed JSON)
INSERT INTO stats(key, value)
VALUES (
    'total_give_coffee',
    (
        SELECT COUNT(*) FROM transactions
        WHERE extra_info ILIKE '%"type":"dong-give-coffee"%'
    )
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
