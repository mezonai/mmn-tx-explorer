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

# Build
go build -o main -tags=production

# Run
./main orchestrator       # Block indexer
./main api                # HTTP API
./main migrate-postgres   # Run migrations

# Test
go test ./... -v                              # All tests
go test ./internal/orchestrator -v            # Single package
go test ./internal/orchestrator -run '^TestNewPoller_ForceFromBlockEnabled$' -v  # Single test

# Lint & Format
golangci-lint run
gofmt -w .              # Format all files
gofmt -l .              # Check formatting
```

### Frontend
```bash
cd frontend

# Install & Run
npm install
npm run dev

# Build & Lint
npm run build
npm run lint
npm run lint:fix

# Format
npm run format         # Format all files
npm run format:check   # Check formatting
```

### Socket Service
```bash
cd socket-service

# Run
go run main.go

# Test
go test ./... -v
go test ./handlers -v

# Lint & Format
golangci-lint run
gofmt -w .
```

### Dong Service
```bash
cd dong-service

# Build & Run
make build
make run

# Test
make test
go test ./handlers -v

# Lint & Format
golangci-lint run
gofmt -w .

# Swagger
make swagger
```

## Code Style

### Frontend (TypeScript/React)
- Use TypeScript for all new code; avoid plain JavaScript
- Respect `strict` mode in `tsconfig.json`
- Use `@/*` path alias for relative imports
- Prefer React function components and hooks
- Add `'use client';` only for client components that need browser APIs or client state
- Use named exports; follow existing barrel file patterns
- Avoid `any`; narrow unknown values instead

**Naming:**
- `PascalCase`: components, classes, interfaces, exported types
- `camelCase`: variables, functions, hooks, object keys
- `UPPER_SNAKE_CASE`: constants like `APP_CONFIG`, `ROUTES`

**Imports:**
- Order: external packages → blank line → `@/` imports → relative imports
- Use `cn()` from `lib/utils.ts` for Tailwind class composition
- Single quotes and semicolons; let Prettier handle formatting

**Error Handling:**
- Throw early for missing invariants (e.g., unauthenticated state)
- Use `try/catch/finally` in async flows to reset loading state
- Use `toast.error(...)` for user-visible failures
- Preserve backend field names (e.g., `payment_info_id`) as API contracts

### Go Services
- Always run `gofmt` on changed files
- Use standard Go import grouping
- Keep package names lowercase
- Use `PascalCase` for exported, `camelCase` for unexported identifiers
- Follow existing service/repository/handler/config structure

**Errors & Logging:**
- Wrap errors: `fmt.Errorf("operation: %w", err)`
- Check cleanup errors for deferred Close/rollback
- Use Zerolog-style structured logging where already in use
- Prefer constants/config over magic numbers

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
