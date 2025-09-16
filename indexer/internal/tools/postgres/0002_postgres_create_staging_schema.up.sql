-- PostgreSQL migration: Create staging schema
-- This migration creates staging tables for temporary data processing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Block data table for staging
CREATE TABLE IF NOT EXISTS block_data (
    chain_id NUMERIC(78, 0) NOT NULL,
    block_number NUMERIC(78, 0) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (chain_id, block_number)
) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Create indexes for staging table
CREATE INDEX IF NOT EXISTS idx_staging_block_data_chain_id ON block_data(chain_id);
CREATE INDEX IF NOT EXISTS idx_staging_block_data_number ON block_data(chain_id, block_number);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_block_data_updated_at ON block_data;
CREATE TRIGGER update_block_data_updated_at BEFORE UPDATE ON block_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
