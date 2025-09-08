-- PostgreSQL schema for orchestrator storage
-- This database is used for orchestration metadata and cursors

-- Create orchestrator database (run this separately)
-- CREATE DATABASE indexer_orchestrator;

-- Connect to orchestrator database and run the following:

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Block failures table
CREATE TABLE IF NOT EXISTS block_failures (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    last_error_timestamp BIGINT NOT NULL,
    failure_count INTEGER DEFAULT 1,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for block failures table
CREATE INDEX IF NOT EXISTS idx_block_failures_block_number_ordered ON block_failures(chain_id, block_number DESC);

-- Cursors table for tracking various processing positions
CREATE TABLE IF NOT EXISTS cursors (
    chain_id NUMERIC(78, 0) NOT NULL,
    cursor_type VARCHAR(30) NOT NULL,
    cursor_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, cursor_type)
) WITH (fillfactor = 80);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_block_failures_updated_at ON block_failures;
CREATE TRIGGER update_block_failures_updated_at BEFORE UPDATE ON block_failures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cursors_updated_at ON cursors;
CREATE TRIGGER update_cursors_updated_at BEFORE UPDATE ON cursors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
