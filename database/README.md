docker compose up -d 

cat clickhouse/*.sql | docker exec -i <clickhouse-container> clickhouse-client --user admin --password password