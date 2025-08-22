# mmn-tx-explorer
Mezon Mainnet Transaction Explorer



Quick start


cd database

docker compose up -d 
===========REPLACE  <clickhouse-container> WITH YOUR CONTAINER ID========

cat clickhouse/*.sql | docker exec -i <clickhouse-container> clickhouse-client --user admin --password password

===========REPLACE  <clickhouse-container> WITH YOUR CONTAINER ID========


indexer, ui
back to folder mmn-tx-explorer
docker compose up -d
