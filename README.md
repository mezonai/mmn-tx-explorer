# mmn-tx-explorer
Mezon Mainnet Transaction Explorer



#Quick start

for database:
```bash
   cp .env.example .env
```

for indexer:
```bash
    cp indexer/configs/config.example.yml indexer/configs/config.yml
    cp indexer/configs/secrets.example.yml indexer/configs/secrets.yml
```

docker compose up --build




run indexer with go for development
```bash
    cd indexer
    docker-compose up -d postgres
    go build -o main -tags=production
    ./main migrate-postgres
    ./main orchestrator   # Starts the indexer
    ./main api           # Starts the API server
```

run dong service
```bash
    cd indexer
    docker-compose up -d postgres
    go build -o main -tags=production
    ./main migrate-postgres # Run migration dong server
    ./main dong-service # Starts dong API server
```