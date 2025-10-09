-- Seed stats table with totals for blocks and wallets
INSERT INTO stats(key, value)
VALUES
    ('total_blocks', (SELECT COUNT(*) FROM blocks)),
    ('total_wallets', (SELECT COUNT(*) FROM wallet))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
