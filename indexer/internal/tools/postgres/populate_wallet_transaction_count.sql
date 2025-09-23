-- -- Script to populate transaction_count for existing wallets
-- -- Run this after migration 0004 to populate data for existing wallets

-- -- Update transaction_count for all existing wallets
-- -- This counts all transactions where the wallet is either sender or receiver
-- UPDATE wallet
-- SET transaction_count = COALESCE((
--     SELECT COUNT(*)
--     FROM transactions
--     WHERE from_address = wallet.address OR to_address = wallet.address
-- ), 0);

-- -- Optional: Verify the update worked
-- -- SELECT address, transaction_count FROM wallet LIMIT 10;

-- -- Optional: Check total transactions to verify
-- -- SELECT COUNT(*) as total_transactions FROM transactions;
-- -- SELECT SUM(transaction_count) as total_counted FROM wallet;
