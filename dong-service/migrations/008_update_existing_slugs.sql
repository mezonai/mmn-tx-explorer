CREATE EXTENSION IF NOT EXISTS unaccent;
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

CREATE OR REPLACE FUNCTION regenerate_clean_slug(campaign_name TEXT, campaign_id BIGINT)
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

ALTER TABLE donation_campaign DROP CONSTRAINT IF EXISTS unique_campaign_slug;

DO $$
DECLARE
    campaign RECORD;
    new_slug TEXT;
    old_slug TEXT;
BEGIN
    RAISE NOTICE 'Starting slug regeneration...';
    
    FOR campaign IN 
        SELECT id, name, slug 
        FROM donation_campaign 
        ORDER BY id
    LOOP
        old_slug := campaign.slug;
        new_slug := regenerate_clean_slug(campaign.name, campaign.id);
        
        IF old_slug != new_slug THEN
            UPDATE donation_campaign 
            SET slug = new_slug
            WHERE id = campaign.id;
            
            RAISE NOTICE 'Campaign ID %: % -> %', campaign.id, old_slug, new_slug;
        ELSE
            RAISE NOTICE 'Campaign ID %: % (no change)', campaign.id, old_slug;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Slug regeneration completed!';
END $$;

ALTER TABLE donation_campaign ADD CONSTRAINT unique_campaign_slug UNIQUE (slug);

DROP FUNCTION IF EXISTS regenerate_clean_slug(TEXT, BIGINT);
DROP FUNCTION IF EXISTS generate_base_slug(TEXT);
DROP FUNCTION IF EXISTS trans_vietnamese(TEXT);