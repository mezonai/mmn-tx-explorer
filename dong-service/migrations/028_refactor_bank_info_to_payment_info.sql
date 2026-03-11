-- Step 1: Add payment_info_id columns to p2p_offers and p2p_orders
ALTER TABLE dong_schema.p2p_offers 
    ADD COLUMN IF NOT EXISTS payment_info_id INTEGER REFERENCES dong_schema.user_payment_info(id);

ALTER TABLE dong_schema.p2p_orders 
    ADD COLUMN IF NOT EXISTS payment_info_id INTEGER REFERENCES dong_schema.user_payment_info(id);

-- Step 2: Migrate p2p_offers bank_info to user_payment_info and update payment_info_id
DO $$
DECLARE
    offer_rec RECORD;
    payment_id INTEGER;
    bank_name_val VARCHAR(255);
    account_number_val VARCHAR(255);
    account_name_val VARCHAR(255);
    column_exists BOOLEAN;
BEGIN
    -- Check if bank_info column exists in p2p_offers
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'dong_schema' 
        AND table_name = 'p2p_offers' 
        AND column_name = 'bank_info'
    ) INTO column_exists;

    -- Only migrate if column exists
    IF column_exists THEN
        FOR offer_rec IN 
            SELECT offer_id, offer_creator_user_id, bank_info 
            FROM dong_schema.p2p_offers 
            WHERE bank_info IS NOT NULL 
            AND bank_info::text != 'null'
            AND bank_info::text != '{}'
        LOOP
            BEGIN
                -- Extract bank info from JSON
                bank_name_val := offer_rec.bank_info->>'bank';
                account_number_val := offer_rec.bank_info->>'account_number';
                account_name_val := offer_rec.bank_info->>'account_name';
                
                -- Skip if essential fields are missing
                IF bank_name_val IS NULL OR account_number_val IS NULL OR account_name_val IS NULL THEN
                    CONTINUE;
                END IF;
                
                -- Check if this payment info already exists
                SELECT id INTO payment_id
                FROM dong_schema.user_payment_info
                WHERE user_id = offer_rec.offer_creator_user_id
                AND bank_name = bank_name_val
                AND account_number = account_number_val;
                
                -- If not exists, create new payment info
                IF payment_id IS NULL THEN
                    INSERT INTO dong_schema.user_payment_info (user_id, bank_name, account_number, account_name, is_primary)
                    VALUES (offer_rec.offer_creator_user_id, bank_name_val, account_number_val, account_name_val, true)
                    RETURNING id INTO payment_id;
                END IF;
                
                -- Update p2p_offers with payment_info_id
                UPDATE dong_schema.p2p_offers
                SET payment_info_id = payment_id
                WHERE offer_id = offer_rec.offer_id;
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Log error but continue with next record
                    RAISE NOTICE 'Error migrating offer_id %: %', offer_rec.offer_id, SQLERRM;
            END;
        END LOOP;
    ELSE
        RAISE NOTICE 'Column bank_info does not exist in p2p_offers, skipping migration';
    END IF;
END $$;

-- Step 3: Migrate p2p_orders bank_info to user_payment_info and update payment_info_id
DO $$
DECLARE
    order_rec RECORD;
    payment_id INTEGER;
    bank_name_val VARCHAR(255);
    account_number_val VARCHAR(255);
    account_name_val VARCHAR(255);
    column_exists BOOLEAN;
BEGIN
    -- Check if bank_info column exists in p2p_orders
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'dong_schema' 
        AND table_name = 'p2p_orders' 
        AND column_name = 'bank_info'
    ) INTO column_exists;

    -- Only migrate if column exists
    IF column_exists THEN
        FOR order_rec IN 
            SELECT order_id, order_creator_user_id, bank_info 
            FROM dong_schema.p2p_orders 
            WHERE bank_info IS NOT NULL 
            AND bank_info::text != 'null'
            AND bank_info::text != '{}'
        LOOP
            BEGIN
                -- Extract bank info from JSON
                bank_name_val := order_rec.bank_info->>'bank';
                account_number_val := order_rec.bank_info->>'account_number';
                account_name_val := order_rec.bank_info->>'account_name';
                
                -- Skip if essential fields are missing
                IF bank_name_val IS NULL OR account_number_val IS NULL OR account_name_val IS NULL THEN
                    CONTINUE;
                END IF;
                
                -- Check if this payment info already exists
                SELECT id INTO payment_id
                FROM dong_schema.user_payment_info
                WHERE user_id = order_rec.order_creator_user_id
                AND bank_name = bank_name_val
                AND account_number = account_number_val;
                
                -- If not exists, create new payment info
                IF payment_id IS NULL THEN
                    INSERT INTO dong_schema.user_payment_info (user_id, bank_name, account_number, account_name, is_primary)
                    VALUES (order_rec.order_creator_user_id, bank_name_val, account_number_val, account_name_val, true)
                    RETURNING id INTO payment_id;
                END IF;
                
                -- Update p2p_orders with payment_info_id
                UPDATE dong_schema.p2p_orders
                SET payment_info_id = payment_id
                WHERE order_id = order_rec.order_id;
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Log error but continue with next record
                    RAISE NOTICE 'Error migrating order_id %: %', order_rec.order_id, SQLERRM;
            END;
        END LOOP;
    ELSE
        RAISE NOTICE 'Column bank_info does not exist in p2p_orders, skipping migration';
    END IF;
END $$;

-- Step 4: Drop old bank_info columns and their indexes
DROP INDEX IF EXISTS dong_schema.idx_p2p_orders_bank_info;

ALTER TABLE dong_schema.p2p_offers
    DROP COLUMN IF EXISTS bank_info;

ALTER TABLE dong_schema.p2p_orders
    DROP COLUMN IF EXISTS bank_info;

-- Step 5: Create indexes for payment_info_id
CREATE INDEX IF NOT EXISTS idx_p2p_offers_payment_info_id ON dong_schema.p2p_offers (payment_info_id);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_payment_info_id ON dong_schema.p2p_orders (payment_info_id);
