CREATE OR REPLACE FUNCTION trg_update_total_p2p_offer_available_delta()
RETURNS trigger AS $$
DECLARE
    delta BIGINT := 0;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'CONFIRMED' AND NEW.amount > 0 THEN
            delta := NEW.amount;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'CONFIRMED' AND OLD.amount > 0 THEN
            delta := -OLD.amount;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        delta :=
            (CASE
                WHEN NEW.status = 'CONFIRMED' THEN COALESCE(NEW.amount, 0)
                ELSE 0
             END)
          - (CASE
                WHEN OLD.status = 'CONFIRMED' THEN COALESCE(OLD.amount, 0)
                ELSE 0
             END);
    END IF;

    IF delta <> 0 THEN
        INSERT INTO public.stats(key, value)
        VALUES ('total_p2p_offer_available', delta)
        ON CONFLICT (key)
        DO UPDATE SET value = public.stats.value + EXCLUDED.value;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_offer_refresh_total_available
ON dong_schema.offers;

CREATE TRIGGER trg_offer_refresh_total_available
AFTER INSERT OR UPDATE OR DELETE ON dong_schema.offers
FOR EACH ROW
EXECUTE FUNCTION trg_update_total_p2p_offer_available_delta();
