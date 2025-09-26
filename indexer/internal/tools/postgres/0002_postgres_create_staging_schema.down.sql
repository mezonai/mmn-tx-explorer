-- PostgreSQL migration: Drop staging schema
-- This migration drops all staging tables, indexes, functions, and triggers

-- Drop trigger first
DROP TRIGGER IF EXISTS update_block_data_updated_at ON block_data;

-- Drop table
DROP TABLE IF EXISTS block_data CASCADE;

-- Drop function (only if not used by other tables)
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extension (only if no other objects depend on it)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
