# Indexer Agents Guide

## Scope

This folder is the blockchain indexer. Prefer changes limited to `indexer/` unless an API contract or shared integration requires cross-service updates.

## What Lives Here

- `cmd/` - Cobra CLI entrypoints
- `api/` - HTTP API setup
- `internal/orchestrator/` - sync pipeline and reorg handling
- `internal/worker/` - block processing
- `internal/rpc/` - blockchain RPC client code
- `internal/storage/` - PostgreSQL access
- `internal/handlers/` - API handlers
- `internal/tools/postgres/` - SQL migrations

## Working Rules

- Keep `cmd/` thin; place business logic in `internal/`
- Preserve reorg safety and idempotent sync behavior
- When storage interfaces change, update mocks and affected tests
- When schema changes are made, include migrations and verify scans still match models
- Use structured logging with zerolog

## Commands

```bash
docker-compose up -d postgres
go build -o main -tags=production
./main migrate-postgres
./main orchestrator
./main api
./main sync_blocks
./main validate
./main validate_and_fix
```

## Verify Before Finish

```bash
go test ./...
golangci-lint run
```
