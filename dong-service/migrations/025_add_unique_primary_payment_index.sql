CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_per_user 
ON user_payment_info (user_id) 
WHERE is_primary = true;
