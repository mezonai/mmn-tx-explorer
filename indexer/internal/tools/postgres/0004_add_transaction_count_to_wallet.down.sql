-- PostgreSQL migration: Remove transaction_count column from wallet table
-- This migration removes transaction_count column (rollback for 0004)

-- Drop index first (required before dropping column)
DROP INDEX IF EXISTS idx_wallet_transaction_count;

-- Drop the column
ALTER TABLE wallet DROP COLUMN IF EXISTS transaction_count;