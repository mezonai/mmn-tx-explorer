UPDATE dong_schema.offers
SET transaction_hash = NULL
WHERE offer_id NOT IN (
    SELECT MAX(offer_id)
    FROM dong_schema.offers
    WHERE transaction_hash IS NOT NULL
    GROUP BY transaction_hash
) AND transaction_hash IS NOT NULL;

ALTER TABLE dong_schema.offers
ADD CONSTRAINT uq_offers_transaction_hash UNIQUE (transaction_hash);
