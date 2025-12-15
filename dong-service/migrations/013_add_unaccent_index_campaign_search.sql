<<<<<<< Updated upstream
CREATE EXTENSION IF NOT EXISTS unaccent;

=======
-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop old trigger and function
DROP TRIGGER IF EXISTS trg_donation_campaign_body_search ON dong_schema.donation_campaign;
DROP FUNCTION IF EXISTS donation_campaign_body_search_trigger();

-- Create new trigger function with unaccent
CREATE OR REPLACE FUNCTION donation_campaign_body_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.body_search := to_tsvector('simple', unaccent(coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, '')));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_donation_campaign_body_search
  BEFORE INSERT OR UPDATE ON dong_schema.donation_campaign
  FOR EACH ROW EXECUTE FUNCTION donation_campaign_body_search_trigger();

-- Update existing data with unaccent
UPDATE dong_schema.donation_campaign
SET body_search = to_tsvector('simple', unaccent(coalesce(name, '') || ' ' || coalesce(description, '')));
>>>>>>> Stashed changes
