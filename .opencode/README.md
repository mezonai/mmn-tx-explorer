# OpenCode Guidance Index

This folder stores project-specific guidance for AI coding agents.

## Root Guides

- `AGENTS.md` - repo-wide rules, boundaries, commands, and verification checklist
- `CLAUDE.md` - Claude Code oriented quick reference

## Service Skills

| Service | Skill File | Local Guide | Use When |
|---|---|---|---|
| `indexer/` | `.opencode/indexer-skill.md` | `indexer/AGENTS.md` | working on block sync, RPC, storage, migrations, or API handlers |
| `frontend/` | `.opencode/frontend-skill.md` | `frontend/AGENTS.md` | working on Next.js pages, modules, shared UI, or frontend types |
| `socket-service/` | `.opencode/socket-service-skill.md` | `socket-service/AGENTS.md` | working on websocket delivery, room logic, auth, Redis, or event persistence |
| `dong-service/` | `.opencode/dong-service-skill.md` | `dong-service/AGENTS.md` | working on donation, lucky money, P2P, wallet, scheduler, or Swagger-backed APIs |

## Recommended Agent Flow

1. Read root `AGENTS.md` for repo-wide constraints.
2. Read the local `AGENTS.md` in the service you are editing.
3. Use the matching skill file for service-specific commands, patterns, and verification.
4. If a backend contract changes, verify matching frontend types and rendering.

## Quick Commands

### `indexer/`
```bash
go test ./...
golangci-lint run
```

### `frontend/`
```bash
npm run lint
npm run build
```

### `socket-service/`
```bash
go test ./...
golangci-lint run
```

### `dong-service/`
```bash
make test
golangci-lint run
make swagger
```

## Notes

- `uiux/` is static reference material only.
- `prove-service/` is separate and currently does not have a dedicated skill file yet.
- Prefer small, service-focused changes unless a contract requires coordinated updates.
