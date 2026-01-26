-- Remove total_p2p_offer_available from stats table
DELETE FROM stats WHERE key = 'total_p2p_offer_available';
DELETE FROM stats WHERE key = 'total_offers';
