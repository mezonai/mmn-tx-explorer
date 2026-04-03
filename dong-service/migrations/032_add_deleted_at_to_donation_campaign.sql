-- Migration: Add deleted_at column for soft delete support
ALTER TABLE donation_campaign 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
