# Indexer Skill

## Overview
Blockchain indexer service written in Go. Syncs data from blockchain to PostgreSQL.

## Tech Stack
- Go with Cobra CLI
- PostgreSQL (3 DBs: orchestrator, staging, main)
- Kafka for events
- Prometheus for metrics
- golangci-lint for linting

## Directory Structure
```
indexer/
├── cmd/           # CLI commands (Cobra-based)
├── api/           # HTTP API layer
├── internal/      # Core logic
│   ├── orchestrator/  # Block sync orchestration
│   ├── worker/       # Block processing
│   ├── rpc/          # RPC client
│   ├── storage/      # PostgreSQL storage
│   ├── handlers/     # HTTP handlers
│   ├── publisher/    # Kafka publisher
│   └── ...
├── configs/      # Configuration files
└── tools/        # Migration scripts
```

## Commands
```bash
cd indexer
docker-compose up -d postgres
go build -o main -tags=production

# Database migrations
./main migrate-postgres

# Run services
./main orchestrator   # Block indexer
./main api            # HTTP API server

# Other commands
./main sync_blocks
./main validate
./main validate_and_fix
```

## Code Style
- Use `go fmt` for formatting
- Run `golangci-lint` before committing
- Use zerolog for logging
- Add error handling for all operations
- Follow Go naming conventions

## Configuration
- Config: `configs/config.yml`
- Secrets: `configs/secrets.yml`
- Linting: `.golangci.yaml`
- Mockery: `.mockery.yaml`

## Key Patterns
- Use interfaces for storage layer
- Handle reorgs properly in block processing
- Use context.Context for cancellation
- Log with structured fields using zerolog
