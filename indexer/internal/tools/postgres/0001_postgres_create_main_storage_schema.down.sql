-- PostgreSQL migration: Drop main storage schema
-- This migration drops all main storage tables, indexes, functions, and triggers

-- Drop triggers first
DROP TRIGGER IF EXISTS update_blocks_updated_at ON blocks;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_logs_updated_at ON logs;
DROP TRIGGER IF EXISTS update_traces_updated_at ON traces;
DROP TRIGGER IF EXISTS update_token_balances_updated_at ON token_balances;
DROP TRIGGER IF EXISTS update_token_transfers_updated_at ON token_transfers;
DROP TRIGGER IF EXISTS update_wallet_updated_at ON wallet;

-- Drop tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS wallet CASCADE;
DROP TABLE IF EXISTS token_transfers CASCADE;
DROP TABLE IF EXISTS token_balances CASCADE;
DROP TABLE IF EXISTS traces CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extension (only if no other objects depend on it)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
