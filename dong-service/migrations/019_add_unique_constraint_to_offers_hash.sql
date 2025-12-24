ALTER TABLE dong_schema.offers
ADD CONSTRAINT uq_offers_transaction_hash UNIQUE (transaction_hash);
