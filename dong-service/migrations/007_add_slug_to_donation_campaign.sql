ALTER TABLE donation_campaign ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

CREATE OR REPLACE FUNCTION trans_vietnamese(input_text TEXT) 
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    result := input_text;

    result := TRANSLATE(result,
        'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ',
        'aaaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyaaaaaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyy'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION generate_campaign_slug(campaign_name TEXT, campaign_id BIGINT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
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
    final_slug := base_slug || '-' || campaign_id;
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE donation_campaign 
SET slug = generate_campaign_slug(name, id)
WHERE slug IS NULL;

ALTER TABLE donation_campaign ALTER COLUMN slug SET NOT NULL;

ALTER TABLE donation_campaign ADD CONSTRAINT unique_campaign_slug UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_donation_campaign_slug ON donation_campaign(slug);

DROP FUNCTION IF EXISTS generate_campaign_slug(TEXT, BIGINT);
DROP FUNCTION IF EXISTS transliterate_vietnamese(TEXT);
