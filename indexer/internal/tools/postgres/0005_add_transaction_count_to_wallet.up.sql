-- PostgreSQL migration: Add transaction_count column to wallet table
-- This migration adds transaction_count column to track wallet transaction count
-- Add new column with default value
ALTER TABLE wallet ADD COLUMN transaction_count INTEGER DEFAULT 0;

