# Dong Service Agents Guide

## Scope

This folder is the main backend for donation campaign, lucky money, P2P trading, wallet flows, and schedulers.

## What Lives Here

- `handlers/` - HTTP handlers
- `repository/` - database access
- `services/` - business logic
- `scheduler/` - background jobs
- `models/` - API and DB models
- `migrations/` - SQL migrations
- `docs/` - Swagger output

## Working Rules

- Keep handlers thin; move business logic into `services/` or repositories as appropriate
- Preserve precision for monetary and blockchain values
- When request or response models change, regenerate Swagger if needed and verify frontend contracts
- When schema changes are introduced, verify migration, model, repository, and handler alignment together
- Keep feature boundaries clear between donation, lucky money, and P2P modules

## Commands

```bash
make build
make run
make test
make swagger
go build -o main .
go run main.go
```

## Verify Before Finish

```bash
make test
golangci-lint run
make swagger
```
