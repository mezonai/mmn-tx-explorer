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
                bank_name_val := offer_rec.bank_info->>'bank_name';
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
                    ON CONFLICT (bank_name, account_number) DO NOTHING;
                END IF;
                
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

-- For p2p_orders
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
                bank_name_val := order_rec.bank_info->>'bank_name';
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
                    ON CONFLICT (bank_name, account_number) DO NOTHING;
                END IF;
                
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

-- Step 2: Drop old bank_info columns and their indexes
DROP INDEX IF EXISTS dong_schema.idx_p2p_orders_bank_info;

ALTER TABLE dong_schema.p2p_offers
    DROP COLUMN IF EXISTS bank_info;

ALTER TABLE dong_schema.p2p_orders
    DROP COLUMN IF EXISTS bank_info;
