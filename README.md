# mmn-tx-explorer
Mezon Mainnet Transaction Explorer



#Quick start

# start & migrate database
cd database

docker compose up -d 


===========REPLACE  <clickhouse-container> WITH YOUR CONTAINER ID========

cat clickhouse/*.sql | docker exec -i <clickhouse-container> clickhouse-client --user admin --password password


# start indexer, ui

back to folder mmn-tx-explorer

docker compose up -d

