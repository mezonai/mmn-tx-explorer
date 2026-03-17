# AGENTS.md

Repository guide for coding agents working in `mmn-tx-explorer`.

## Scope

- This repo is a small monorepo with multiple runnable services.
- Main work happens in `frontend/`, `indexer/`, `dong-service/`, and `socket-service/`.
- There is currently no existing repo-local Cursor or Copilot instruction file.
- Checked locations: `.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`.

## Repo Map

- `frontend/`: Next.js 15 + React 19 + TypeScript UI.
- `indexer/`: Go indexer/API service with tests and CI workflows.
- `dong-service/`: Go API service with Makefile and Swagger generation.
- `socket-service/`: Go websocket service.
- `prove-service/`: small Go example/service.
- Root `docker-compose.yml`: local multi-service orchestration.

## Root Commands

- Start the local stack from the repo root: `docker compose up --build`
- Prefer running commands from the relevant service directory instead of the repo root.

## Frontend Commands

Run in `frontend/`.

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Production build: `npm run build`
- Start built app: `npm run start`
- Lint: `npm run lint`
- Auto-fix lint issues: `npm run lint:fix`
- Format all files: `npm run format`
- Check formatting only: `npm run format:check`

## Frontend Tests

- There is no frontend test runner configured in `frontend/package.json` right now.
- Do not invent `npm test` commands in this repo.
- If you add frontend tests, document the runner and single-test command in the same change.

## Indexer Commands

Run in `indexer/`.

- Download modules: `go mod download`
- Build binary: `go build -o main .`
- Run migrations: `./main migrate-postgres`
- Start orchestrator: `./main orchestrator`
- Start API: `./main api`
- Start with test config: `./main orchestrator --config configs/test_config.yml`
- Run all tests: `go test ./... -v`
- Run one package: `go test ./internal/orchestrator -v`
- Run one test: `go test ./internal/orchestrator -run '^TestNewPoller_ForceFromBlockEnabled$' -v`
- Format check: `gofmt -l .`
- Apply formatting: `gofmt -w .`
- Lint: `golangci-lint run`

## Dong Service Commands

Run in `dong-service/`.

- Show Make targets: `make help`
- Build: `make build`
- Run: `make run`
- Run directly: `go run main.go`
- Run all tests: `make test`
- Equivalent test command: `go test -v ./...`
- Run one package: `go test ./handlers -v`
- Run one test: `go test ./handlers -run '^TestName$' -v`
- Generate Swagger: `make swagger`
- Lint: `golangci-lint run`
- Format: `gofmt -w .`
- Vulnerability scan: `make govulncheck`
- Full security scan: `make security-scan`

## Socket Service Commands

Run in `socket-service/`.

- Download modules: `go mod download`
- Run: `go run main.go`
- Build: `go build ./...`
- Run all tests: `go test ./... -v`
- Run one package: `go test ./handlers -v`
- Run one test: `go test ./handlers -run '^TestName$' -v`
- Lint: `golangci-lint run`
- Format: `gofmt -w .`

## Prove Service Commands

Run in `prove-service/`.

- Run: `go run main.go`
- Build: `go build ./...`
- Test: `go test ./... -v`

## Single-Test Guidance

- For Go services, prefer `go test ./path/to/package -run '^TestExactName$' -v`.
- Keep the regex anchored with `^` and `$` to avoid accidental partial matches.
- If a package has subtests, use `-run 'TestName/SubtestName'`.
- There is no supported single-test command for the frontend yet because no test framework is configured.

## Frontend Style

- Use TypeScript, not plain JS, for new frontend logic.
- Respect `strict` TypeScript settings from `frontend/tsconfig.json`.
- Use the `@/*` path alias for repo-local imports whenever it keeps paths clearer.
- Prefer React function components and hooks.
- Add `'use client';` only for client components/hooks that need it.
- Use named exports by default; this codebase uses many named exports and barrel files.
- Prefer explicit prop, context, and return types for exported APIs.
- Avoid `any`; existing code has some, but new code should narrow unknown values instead.
- Use `PascalCase` for components, classes, interfaces, and exported types.
- Use `camelCase` for variables, functions, hooks, and object keys unless the backend contract says otherwise.
- Use `UPPER_SNAKE_CASE` for constants like `APP_CONFIG`, `ROUTES`, and `STORAGE_KEYS`.
- Existing frontend type names often use prefixes like `I`, `T`, and enum prefix `E`; follow nearby file conventions instead of mass-renaming.
- Keep utility helpers in `utils/`, constants in `constant/`, and reusable UI in `components/`.

## Frontend Imports and Formatting

- Match the common import order: framework/external packages, blank line, `@/` imports, then relative imports.
- Keep CSS class composition centralized with `cn(...)` from `frontend/lib/utils.ts` when combining Tailwind classes.
- Use single quotes and semicolons; Prettier enforces formatting through ESLint.
- Do not manually fight formatter output.

## Frontend Error Handling

- Throw early for missing invariants (for example, missing authenticated user state).
- In async UI flows, use `try/catch/finally` when loading state must always reset.
- Surface user-visible failures with `toast.error(...)` where the UX already follows that pattern.
- Logging with `console.error` and `console.warn` exists, but pair logs with user-facing handling when appropriate.
- Preserve backend field names like `payment_info_id` when that is the API contract.

## Go Style

- Always run `gofmt` on changed Go files.
- Use standard Go import grouping and formatting; do not hand-format tabs/spaces.
- Keep package names short and lowercase.
- Use `PascalCase` for exported identifiers and `camelCase` for unexported ones.
- Prefer small constructors like `NewWSService`, `NewHTTPHandler`, and `LoadConfig` to wire dependencies.
- Follow the existing service/repository/handler/config package layout instead of creating ad hoc folders.

## Go Error Handling and Logging

- Wrap returned errors with context using `fmt.Errorf("...: %w", err)`.
- Check cleanup errors in deferred `Close`, rollback, and row iteration paths.
- Use structured logging with Zerolog-style fields where those packages are already in use.
- Prefer constants/config values over magic numbers when behavior is configurable.

## Go Testing Conventions

- Use the standard `testing` package.
- The indexer tests use `testify/assert` and mocks under `indexer/test/mocks`.
- Follow the existing `TestThing_Scenario` naming style for focused unit tests.
- Keep setup helpers local to the package when they are test-specific.
- When adding tests, make sure they pass with `go test ./... -v` from that service directory.

## Agent Workflow Expectations

- Before editing, identify which service owns the change and work from that directory's conventions.
- Prefer the smallest targeted change over cross-service refactors.
- Do not assume a root-wide lint or test command exists.
- If you add a new command, script, or test runner, update this file.
