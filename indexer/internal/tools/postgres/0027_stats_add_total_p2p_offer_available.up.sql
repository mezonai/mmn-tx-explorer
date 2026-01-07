-- Seed stats table with total_p2p_offer_available (sum of amounts from confirmed offers)
INSERT INTO stats(key, value)
VALUES (
    'total_p2p_offer_available',
    (
        SELECT COALESCE(SUM(amount), 0) FROM dong_schema.offers
        WHERE status = 'CONFIRMED'
    )
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
