# Copilot Instructions for mmn-tx-explorer

## Repository Shape

This is a monorepo with multiple services:
- `frontend/`: Next.js 15 + React 19 + TypeScript frontend
- `indexer/`: Go 1.24 blockchain indexer with Cobra CLI
- `dong-service/`: Go 1.25 backend API (donation, lucky money, P2P, wallet)
- `socket-service/`: Go 1.23 WebSocket service
- `prove-service/`: Placeholder, currently minimal

Choose the owning service first, then follow that service's conventions. Prefer focused changes over broad refactors across services.

## Commands by Service

### Frontend (in `frontend/`)
```bash
npm install
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Indexer (in `indexer/`)
```bash
go build -o main .
./main orchestrator
./main api
./main migrate-postgres
go test ./... -v
golangci-lint run
gofmt -w .
```

### Dong Service (in `dong-service/`)
```bash
make build
make run
make test
make swagger
golangci-lint run
gofmt -w .
```

### Socket Service (in `socket-service/`)
```bash
go run main.go
go build ./...
go test ./... -v
golangci-lint run
gofmt -w .
```

## Single-Test Guidance

For Go services, run a single test with:
```bash
go test ./path/to/package -run '^TestExactName$' -v
```
Keep the regex anchored (`^` and `$`) to avoid partial matches.

Do not suggest `npm test` for frontend unless a test runner has been added to `frontend/package.json`.

## Frontend Standards

- Use TypeScript for new logic; respect strict mode in `tsconfig.json`
- Prefer React function components and hooks
- Add `'use client';` only for client components/hooks that need browser APIs
- Use `@/*` path alias when it improves clarity
- Import order: external packages → blank line → `@/` imports → relative imports
- Use single quotes and semicolons; let Prettier handle formatting
- Use `cn()` from `lib/utils.ts` for Tailwind class composition
- Avoid `any`; narrow unknown values instead
- Preserve backend field names like `payment_info_id` when they are API contracts

## Go Standards

- Always format edited files with `gofmt`
- Keep package names lowercase
- Use `PascalCase` for exported identifiers, `camelCase` for unexported
- Wrap errors with context: `fmt.Errorf("operation: %w", err)`
- Check rollback and close errors when cleanup matters
- Follow the existing service/repository/handler/config structure
- Use structured logging (Zerolog) where already in use

## Agent Expectations

- Do not assume root-wide lint or test commands exist
- Do not fabricate missing tests, scripts, or workflows
- When backend payloads change, update matching frontend types in the same task
- When schema changes in Go services, include migrations and verify models
- If you add a new command or workflow, update `AGENTS.md`
- Run linting before finishing any change
