WITH offer_stats AS (
    SELECT
        COALESCE(SUM(amount), 0) AS total_p2p_offer_available,
        COUNT(*) AS total_offers
    FROM dong_schema.offers
    WHERE status = 'CONFIRMED'
)
INSERT INTO stats(key, value)
SELECT 'total_p2p_offer_available', total_p2p_offer_available FROM offer_stats
UNION ALL
SELECT 'total_offers', total_offers FROM offer_stats
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
