-- Remove seeded totals for blocks and wallets from stats table
DELETE FROM stats WHERE key IN ('total_blocks', 'total_wallets');
