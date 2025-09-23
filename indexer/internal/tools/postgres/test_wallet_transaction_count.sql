-- -- Test script for wallet transaction_count migration
-- -- Run this to verify the migration worked correctly

-- -- 1. Check if column exists
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'wallet' AND column_name = 'transaction_count';

-- -- 2. Check if index exists
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'wallet' AND indexname = 'idx_wallet_transaction_count';

-- -- 3. Sample data check
-- SELECT address, transaction_count, updated_at
-- FROM wallet
-- ORDER BY transaction_count DESC
-- LIMIT 5;

-- -- 4. Verify data integrity (should match)
-- SELECT
--     (SELECT COUNT(*) FROM transactions) as total_transactions,
--     (SELECT SUM(transaction_count) FROM wallet) as total_counted,
--     (SELECT COUNT(*) FROM wallet WHERE transaction_count > 0) as wallets_with_transactions;

-- -- 5. Performance test - should be fast now
-- EXPLAIN ANALYZE
-- SELECT address, account_nonce, balance, transaction_count
-- FROM wallet
-- WHERE transaction_count > 0
-- ORDER BY transaction_count DESC
-- LIMIT 10;
