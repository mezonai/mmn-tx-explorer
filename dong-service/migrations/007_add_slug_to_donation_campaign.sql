CREATE EXTENSION IF NOT EXISTS unaccent;
ALTER TABLE donation_campaign ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

CREATE OR REPLACE FUNCTION trans_vietnamese(input_text TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN unaccent(input_text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION generate_base_slug(campaign_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
BEGIN
    base_slug := trans_vietnamese(campaign_name);
    base_slug := LOWER(base_slug);
    base_slug := REGEXP_REPLACE(base_slug, '\s+', ' ', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'campaign';
    END IF;
    RETURN base_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION generate_unique_campaign_slug(campaign_name TEXT, campaign_id BIGINT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    candidate_slug TEXT;
    suffix INT;
    slug_exists BOOLEAN;
BEGIN
    base_slug := generate_base_slug(campaign_name);
    candidate_slug := base_slug;
    
    SELECT EXISTS(
        SELECT 1 FROM donation_campaign 
        WHERE slug = candidate_slug AND id != campaign_id
    ) INTO slug_exists;
    
    IF slug_exists THEN
        suffix := 1;
        LOOP
            candidate_slug := base_slug || '-' || suffix;
            
            SELECT EXISTS(
                SELECT 1 FROM donation_campaign 
                WHERE slug = candidate_slug AND id != campaign_id
            ) INTO slug_exists;
            
            EXIT WHEN NOT slug_exists OR suffix > 1000;
            
            suffix := suffix + 1;
        END LOOP;
    END IF;
    
    RETURN candidate_slug;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    campaign RECORD;
    new_slug TEXT;
BEGIN
    FOR campaign IN 
        SELECT id, name 
        FROM donation_campaign 
        WHERE slug IS NULL 
        ORDER BY id
    LOOP
        new_slug := generate_unique_campaign_slug(campaign.name, campaign.id);
        
        UPDATE donation_campaign 
        SET slug = new_slug
        WHERE id = campaign.id;
    END LOOP;
END $$;

ALTER TABLE donation_campaign ALTER COLUMN slug SET NOT NULL;
ALTER TABLE donation_campaign ADD CONSTRAINT unique_campaign_slug UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_donation_campaign_slug ON donation_campaign(slug);

DROP FUNCTION IF EXISTS generate_unique_campaign_slug(TEXT, BIGINT);
DROP FUNCTION IF EXISTS generate_base_slug(TEXT);
DROP FUNCTION IF EXISTS transliterate_vietnamese(TEXT);
