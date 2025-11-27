ALTER TABLE dong_schema.donation_campaign
  ADD COLUMN IF NOT EXISTS body_search tsvector;

UPDATE dong_schema.donation_campaign
SET body_search = plainto_tsquery('simple', coalesce(name, '') || ' ' || coalesce(description, ''));

CREATE OR REPLACE FUNCTION donation_campaign_body_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.body_search := plainto_tsquery('simple', coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_donation_campaign_body_search ON dong_schema.donation_campaign;
CREATE TRIGGER trg_donation_campaign_body_search
  BEFORE INSERT OR UPDATE ON dong_schema.donation_campaign
  FOR EACH ROW EXECUTE FUNCTION donation_campaign_body_search_trigger();

CREATE INDEX IF NOT EXISTS idx_donation_campaign_body_search ON dong_schema.donation_campaign USING GIN (body_search);