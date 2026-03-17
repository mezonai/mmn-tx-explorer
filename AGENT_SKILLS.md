# Agent Skills

Reusable playbooks for AI agents working in `mmn-tx-explorer`.

---

## Skill: Identify Owning Service

Before editing, determine which service owns the change:

| Change Type | Service |
|-------------|---------|
| UI, pages, hooks, frontend types | `frontend/` |
| Block sync, RPC, storage, API handlers | `indexer/` |
| Donation campaigns, lucky money, P2P, wallet | `dong-service/` |
| WebSocket, real-time events | `socket-service/` |
| Proof verification (future) | `prove-service/` |

If the change spans services (e.g., backend API contract change), update both producer and consumer in the same task.

---

## Skill: Frontend Change

Use for UI, hooks, providers, and app-router work in `frontend/`.

**Checklist:**

1. Identify whether the file is server or client code
2. Add `'use client';` only if hooks, browser APIs, or client state are required
3. Use `@/*` imports when clearer than long relative paths
4. Keep import order: external packages, blank line, `@/` imports, relative imports
5. Follow existing naming patterns for `I*`, `T*`, `E*` types
6. Use `toast.error(...)` for user-visible async failures where the feature already uses toasts
7. Run `npm run lint` and `npm run format:check` when relevant

---

## Skill: Go Service Change

Use for API, storage, scheduler, repository, middleware, and service changes in Go services.

**Checklist:**

1. Work inside the owning service directory
2. Follow the existing package layout instead of creating new patterns
3. Wrap errors with `fmt.Errorf("...: %w", err)`
4. Check close, rows, and rollback cleanup paths
5. Keep exported constructors small and explicit
6. Run `gofmt -w .` on changed files
7. Run relevant Go tests

---

## Skill: Single-Test Execution

Use when validating a narrow Go change.

**Pattern:**

```bash
# All tests in a package
go test ./path/to/package -v

# Single test (exact match)
go test ./path/to/package -run '^TestExactName$' -v

# Subtest
go test ./path/to/package -run 'TestName/SubtestName' -v
```

**Notes:**
- Keep `-run` regexes anchored for exact test matches
- Frontend has no default single-test workflow (no test runner configured)

---

## Skill: API Contract Safety

Use when editing handlers, DTOs, frontend API clients, or serialized payloads.

**Checklist:**

1. Preserve backend field names used in contracts (e.g., `payment_info_id`)
2. Avoid opportunistic renaming of request/response keys
3. Keep query and JSON field names aligned with existing public API behavior
4. Update both producer (backend) and consumer (frontend) only when the contract change is intentional

---

## Skill: Schema Change in Go Services

Use when modifying database schema or storage interfaces.

**Checklist:**

1. Add migration file in the service's `migrations/` folder
2. Update models to reflect new schema
3. Update repository scans and queries
4. Run `make swagger` if handlers are affected (dong-service)
5. Verify mocks still match interfaces (especially indexer)
6. Run `go test ./...` to ensure nothing breaks

---

## Skill: Docs and Command Updates

Use when adding scripts, workflows, test runners, or local developer commands.

**Checklist:**

1. Update `AGENTS.md` when command guidance changes
2. Update service-specific docs if the workflow is service-owned
3. Do not document commands that are not present or verified
4. Call out missing test coverage explicitly rather than inventing commands

---

## Skill: Linting and Formatting

Always run before finishing any change.

**Frontend:**
```bash
npm run lint
npm run format:check
```

**Go services:**
```bash
golangci-lint run
gofmt -l .
```

If issues found:
```bash
gofmt -w .
```
