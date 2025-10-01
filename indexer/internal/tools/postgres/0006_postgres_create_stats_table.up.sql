-- Create stats table with two columns: key and value
CREATE TABLE IF NOT EXISTS stats (
    key TEXT PRIMARY KEY,
    value BIGINT NOT NULL
);

-- Initialize the first record with total number of transactions
INSERT INTO stats(key, value)
VALUES ('total_transactions', (SELECT COUNT(*) FROM transactions))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
