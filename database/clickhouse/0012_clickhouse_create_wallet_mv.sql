
CREATE MATERIALIZED VIEW IF NOT EXISTS wallet_addresses_mv TO wallet AS
SELECT 
    address,
    0 as balance,
    now() as created_at,
    now() as updated_at
FROM (
    SELECT DISTINCT from_address as address FROM transactions WHERE from_address != ''
    UNION DISTINCT
    SELECT DISTINCT to_address as address FROM transactions WHERE to_address != ''
)
WHERE address != '';


INSERT INTO wallet (address, balance, created_at, updated_at)
SELECT 
    t.address,
    0,
    now(),
    now()
FROM (
    SELECT DISTINCT from_address as address FROM transactions WHERE from_address != ''
    UNION DISTINCT
    SELECT DISTINCT to_address as address FROM transactions WHERE to_address != ''
) t
LEFT JOIN wallet w ON t.address = w.address
WHERE w.address IS NULL
AND t.address != '';
