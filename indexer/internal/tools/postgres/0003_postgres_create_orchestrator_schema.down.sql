-- PostgreSQL migration: Drop orchestrator schema
-- This migration drops all orchestrator tables, indexes, functions, and triggers

-- Drop triggers first
DROP TRIGGER IF EXISTS update_block_failures_updated_at ON block_failures;
DROP TRIGGER IF EXISTS update_cursors_updated_at ON cursors;

-- Drop tables
DROP TABLE IF EXISTS cursors CASCADE;
DROP TABLE IF EXISTS block_failures CASCADE;

-- Drop function (only if not used by other tables)
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extension (only if no other objects depend on it)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
