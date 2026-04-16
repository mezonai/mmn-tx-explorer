-- Rename p2p_offers creator columns
ALTER TABLE IF EXISTS dong_schema.p2p_offers
    RENAME COLUMN seller_wallet_address TO offer_creator_wallet_address;
ALTER TABLE IF EXISTS dong_schema.p2p_offers
    RENAME COLUMN seller_user_id TO offer_creator_user_id;

-- Rename p2p_orders creator columns
ALTER TABLE IF EXISTS dong_schema.p2p_orders
    RENAME COLUMN buyer_wallet_address TO order_creator_wallet_address;
ALTER TABLE IF EXISTS dong_schema.p2p_orders
    RENAME COLUMN buyer_user_id TO order_creator_user_id;
