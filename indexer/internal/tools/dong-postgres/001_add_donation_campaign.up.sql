-- Migration: create donation_campaign table
-- This migration creates the donation_campaign table with required and optional fields.

CREATE TABLE IF NOT EXISTS donation_campaign (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    goal BIGINT,
    url TEXT,
    end_date TEXT,
    donation_wallet TEXT NOT NULL,
    creator BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
