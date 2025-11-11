-- Remove average_block key from stats table
DELETE FROM stats WHERE key = 'average_block';
