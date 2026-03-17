# Agent Skills

Reusable playbooks for agents working in `mmn-tx-explorer`.

## Skill: Frontend Change

Use for UI, hooks, providers, and app-router work in `frontend/`.

Checklist:

1. Identify whether the file is server or client code.
2. Add `'use client';` only if hooks, browser APIs, or client state are required.
3. Use `@/*` imports when clearer than long relative paths.
4. Keep import order: external, blank line, alias imports, relative imports.
5. Preserve existing naming patterns for `I*`, `T*`, and `E*` types.
6. Use `toast.error(...)` for user-visible async failures where the feature already uses toasts.
7. Run `npm run lint` and `npm run format:check` in `frontend/` when relevant.

## Skill: Go Service Change

Use for API, storage, scheduler, repository, middleware, and service changes in Go services.

Checklist:

1. Work inside the owning service directory.
2. Follow the existing package layout instead of creating new top-level patterns.
3. Wrap errors with `fmt.Errorf("...: %w", err)`.
4. Check close, rows, and rollback cleanup paths.
5. Keep exported constructors small and explicit.
6. Run `gofmt -w .` on changed files.
7. Run the smallest relevant Go tests first, then broader package/service tests if needed.

## Skill: Single-Test Execution

Use when validating a narrow Go change.

Pattern:

- Package: `go test ./path/to/package -v`
- Exact test: `go test ./path/to/package -run '^TestExactName$' -v`
- Subtest: `go test ./path/to/package -run 'TestExactName/SubtestName' -v`

Notes:

- Keep `-run` regexes anchored for exact test matches.
- Frontend currently has no default single-test workflow because no test runner is configured.

## Skill: API Contract Safety

Use when editing handlers, DTOs, frontend API clients, or serialized payloads.

Checklist:

1. Preserve backend field names used in contracts such as `payment_info_id`.
2. Avoid opportunistic renaming of request/response keys.
3. Keep query and JSON field names aligned with existing public API behavior.
4. Update both producer and consumer only when the contract change is intentional.

## Skill: Docs and Command Updates

Use when adding scripts, workflows, test runners, or local developer commands.

Checklist:

1. Update `AGENTS.md` when command guidance changes.
2. Update service-specific docs if the workflow is service-owned.
3. Do not document commands that are not present or verified.
4. Call out missing test coverage explicitly rather than inventing commands.
