-- -- Create optimized indexes for populate query
-- -- Current indexes include chain_id and block_number which don't help our query

-- -- 1. Check current indexes (you already did this)
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'transactions'
-- ORDER BY indexname;

-- -- 2. Create better indexes for our populate query
-- -- These will be much faster for: WHERE from_address = ? OR to_address = ?

-- -- Option A: Separate indexes (recommended)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_from_addr_only
-- ON transactions(from_address);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_to_addr_only
-- ON transactions(to_address);

-- -- Option B: Composite index for both (alternative)
-- -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_both_addresses
-- -- ON transactions(from_address, to_address);

-- -- 3. Verify new indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'transactions'
--   AND (indexname LIKE '%from_addr%' OR indexname LIKE '%to_addr%' OR indexname LIKE '%both%')
-- ORDER BY indexname;
