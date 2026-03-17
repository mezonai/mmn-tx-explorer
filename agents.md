# AGENTS.md — Repo-Wide AI Agent Guide

## Project Overview

Mezon Mainnet Transaction Explorer — a blockchain transaction indexing and exploration platform consisting of multiple services in a monorepo.

## Services

| Service | Tech Stack | Go Version | Purpose |
|---------|------------|------------|---------|
| `indexer/` | Go, Cobra, PostgreSQL, Kafka | 1.24 | Block sync, transaction parsing, HTTP API |
| `frontend/` | Next.js 15, TypeScript, React 19, Tailwind CSS 4 | — | Block explorer, P2P, lucky money, donation |
| `socket-service/` | Go, Gin, Gorilla WebSocket, Redis | 1.23 | Real-time event broadcasting |
| `dong-service/` | Go, Gin, PostgreSQL, Redis | 1.25 | Donation, lucky money, P2P trading, wallet |
| `prove-service/` | (empty, placeholder) | — | Proof verification (future) |
| `uiux/` | Static HTML | — | Design reference only, not production code |

## Repo Boundaries

- Each service is self-contained with its own `go.mod` or `package.json`.
- Prefer changes scoped to a single service unless an API contract requires coordination.
- Treat `uiux/` as reference material only.
- `prove-service/` is currently empty.

## Working Rules

1. **Service scope** — Prefer changing only the relevant service for the request.
2. **Backend → frontend sync** — When backend responses change, update frontend types and rendering in the same task.
3. **Schema changes** — When schema changes are made in Go services, check migration, model, repository, handler, and Swagger alignment.
4. **No secrets** — Never commit secrets or credentials.
5. **Linting first** — Run linting before committing (golangci-lint for Go, `npm run lint` for frontend).
6. **Service-focused PRs** — Keep PRs service-focused when possible.

## Commands

### All services
```bash
docker compose up --build
```

### Indexer
```bash
cd indexer
go build -o main -tags=production
./main orchestrator       # Block indexer
./main api                # HTTP API
./main migrate-postgres   # Run migrations
go test ./...
golangci-lint run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

### Socket Service
```bash
cd socket-service
go run main.go
go test ./...
golangci-lint run
```

### Dong Service
```bash
cd dong-service
make build
make run
make test
make swagger
golangci-lint run
```

## Verification Checklist

Before finishing any task, verify the appropriate items:

- [ ] `golangci-lint run` passes for any Go service you touched
- [ ] `go test ./...` (or `make test`) passes for any Go service you touched
- [ ] `npm run lint` passes for frontend changes
- [ ] `npm run build` passes for frontend changes that affect routes, types, configs, or component boundaries
- [ ] `make swagger` regenerated if dong-service request/response models changed
- [ ] Frontend types updated if backend payloads changed
- [ ] Migrations included if schema changed

## Per-Service Guides

Each service has a local `AGENTS.md` with service-specific details:
- `indexer/AGENTS.md`
- `frontend/AGENTS.md`
- `dong-service/AGENTS.md`
- `socket-service/AGENTS.md`

## Skill Files

Detailed skill files for AI agents are in `.opencode/`:
- `.opencode/indexer-skill.md`
- `.opencode/frontend-skill.md`
- `.opencode/dong-service-skill.md`
- `.opencode/socket-service-skill.md`
