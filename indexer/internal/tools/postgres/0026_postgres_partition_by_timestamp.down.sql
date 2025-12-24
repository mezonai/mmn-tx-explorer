-- Rollback partition by timestamp migration

-- Drop triggers on new tables
DROP TRIGGER IF EXISTS update_blocks_updated_at ON blocks;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

-- Drop indexes on new tables
DROP INDEX IF EXISTS idx_blocks_chain_id_transaction_count;
DROP INDEX IF EXISTS idx_transactions_block_hash;
DROP INDEX IF EXISTS idx_transactions_hash;
DROP INDEX IF EXISTS idx_transactions_only_from_address;
DROP INDEX IF EXISTS idx_transactions_only_to_address;
DROP INDEX IF EXISTS idx_transactions_only_transaction_timestamp;
DROP INDEX IF EXISTS idx_transactions_from_address_timestamp;
DROP INDEX IF EXISTS idx_transactions_to_address_timestamp;
DROP INDEX IF EXISTS idx_transactions_block_number_timestamp;
DROP INDEX IF EXISTS idx_transactions_timestamp_hash;
DROP INDEX IF EXISTS idx_transaction_extra_info_type_status;

-- Swap back to old tables
DO $$
BEGIN
    IF to_regclass('public.blocks') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE blocks RENAME TO blocks_new';
    END IF;

    IF to_regclass('public.transactions') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE transactions RENAME TO transactions_new';
    END IF;

    IF to_regclass('public.blocks_old') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE blocks_old RENAME TO blocks';
    END IF;

    IF to_regclass('public.transactions_old') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE transactions_old RENAME TO transactions';
    END IF;
END
$$;

-- Restore old constraint names
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'blocks_pkey_old'
    ) THEN
        EXECUTE 'ALTER TABLE blocks RENAME CONSTRAINT blocks_pkey_old TO blocks_pkey';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'transactions_pkey_old'
    ) THEN
        EXECUTE 'ALTER TABLE transactions RENAME CONSTRAINT transactions_pkey_old TO transactions_pkey';
    END IF;
END
$$;

-- Update pg_partman config back to *_new tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'partman') THEN
        UPDATE partman.part_config
        SET parent_table = 'public.blocks_new'
        WHERE parent_table = 'public.blocks';

        UPDATE partman.part_config
        SET parent_table = 'public.transactions_new'
        WHERE parent_table = 'public.transactions';
    END IF;
END
$$;

-- Restore old index names
ALTER INDEX IF EXISTS idx_blocks_chain_id_transaction_count_old RENAME TO idx_blocks_chain_id_transaction_count;
ALTER INDEX IF EXISTS idx_transactions_block_hash_old RENAME TO idx_transactions_block_hash;
ALTER INDEX IF EXISTS idx_transactions_hash_old RENAME TO idx_transactions_hash;
ALTER INDEX IF EXISTS idx_transactions_only_from_address_old RENAME TO idx_transactions_only_from_address;
ALTER INDEX IF EXISTS idx_transactions_only_to_address_old RENAME TO idx_transactions_only_to_address;
ALTER INDEX IF EXISTS idx_transactions_only_transaction_timestamp_old RENAME TO idx_transactions_only_transaction_timestamp;
ALTER INDEX IF EXISTS idx_transactions_from_address_timestamp_old RENAME TO idx_transactions_from_address_timestamp;
ALTER INDEX IF EXISTS idx_transactions_to_address_timestamp_old RENAME TO idx_transactions_to_address_timestamp;
ALTER INDEX IF EXISTS idx_transactions_block_number_timestamp_old RENAME TO idx_transactions_block_number_timestamp;
ALTER INDEX IF EXISTS idx_transactions_timestamp_hash_old RENAME TO idx_transactions_timestamp_hash;
ALTER INDEX IF EXISTS idx_transaction_extra_info_type_status_old RENAME TO idx_transaction_extra_info_type_status;

-- Recreate triggers on restored tables
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Unschedule pg_cron job (if exists)
DO $$
DECLARE
    job_id integer;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        SELECT jobid INTO job_id
        FROM cron.job
        WHERE jobname = 'pg_partman_maintenance';

        IF job_id IS NOT NULL THEN
            PERFORM cron.unschedule(job_id);
        END IF;
    END IF;
END
$$;

-- Drop new partitioned tables (CASCADE removes all partitions managed by pg_partman)
DROP TABLE IF EXISTS blocks_new CASCADE;
DROP TABLE IF EXISTS transactions_new CASCADE;

-- Drop extensions (optional - comment out if you want to keep them for other uses)
DROP EXTENSION IF EXISTS pg_partman CASCADE;
DROP EXTENSION IF EXISTS pg_cron CASCADE;
