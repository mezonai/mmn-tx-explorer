# Copilot Instructions for mmn-tx-explorer

## Repository Shape

- This is a monorepo with multiple services.
- Main directories: `frontend/`, `indexer/`, `dong-service/`, `socket-service/`, `prove-service/`.
- Choose the owning service first, then follow that service's conventions.
- Prefer focused changes over broad refactors across services.

## Commands

- Run commands from the relevant service directory.
- Frontend: `npm run dev`, `npm run build`, `npm run lint`, `npm run format:check`
- Indexer: `go build -o main .`, `go test ./... -v`, `golangci-lint run`, `gofmt -w .`
- Dong service: `make build`, `make run`, `make test`, `make swagger`
- Socket service: `go run main.go`, `go build ./...`, `go test ./... -v`
- Prove service: `go run main.go`, `go build ./...`, `go test ./... -v`

## Testing Guidance

- Prefer single-test execution for Go changes when possible: `go test ./path/to/package -run '^TestExactName$' -v`.
- Keep test regexes anchored.
- Do not suggest `npm test` for the frontend unless a test runner is added to `frontend/package.json`.

## Frontend Standards

- Use TypeScript for new logic and respect strict typing.
- Prefer React function components and hooks.
- Use the `@/*` path alias when it keeps imports clearer.
- Keep import order as external packages, blank line, `@/` imports, then relative imports.
- Use single quotes and semicolons.
- Use `cn(...)` from `frontend/lib/utils.ts` for Tailwind class composition.
- Prefer named exports.
- Avoid `any`; narrow unknown values instead.
- Preserve backend field names when they are part of the API contract.
- In async UI flows, reset loading state in `finally`.
- Pair `console.error` with user-visible handling when the UX already uses `toast.error(...)`.

## Go Standards

- Always format edited files with `gofmt`.
- Keep package names lowercase.
- Use `PascalCase` for exported identifiers and `camelCase` for unexported ones.
- Wrap errors with context using `fmt.Errorf("...: %w", err)`.
- Check rollback and close errors when cleanup matters.
- Follow the existing service/repository/handler/config structure.
- Use structured logging where Zerolog-style logging already exists.

## Agent Expectations

- Do not assume root-wide lint or test commands exist.
- Do not fabricate missing tests, scripts, or workflows.
- If you add a new command or workflow, update `AGENTS.md`.
