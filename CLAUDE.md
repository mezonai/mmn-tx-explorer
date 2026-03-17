# CLAUDE.md

This file provides Claude Code with project-specific context and instructions.

## Project Overview

Mezon Mainnet Transaction Explorer - a blockchain transaction indexing and exploration platform.

## Quick Reference

| Service | Tech Stack | Key Features |
|---------|------------|--------------|
| `indexer` | Go, Cobra, PostgreSQL | Block sync, transaction parsing |
| `frontend` | Next.js 15, TypeScript, React 19, Tailwind CSS 4 | Block explorer, P2P, lucky money |
| `socket-service` | Go, Gin, WebSocket | Real-time events |
| `dong-service` | Go 1.25, Gin | Donation, lucky money, P2P trading |
| `prove-service` | Separate service | Proof verification |
| `uiux` | Static HTML | Design reference only |

## Important Files

- `AGENTS.md` / `agents.md` - Repo-wide rules for all AI assistants (same file on Windows)
- `.opencode/indexer-skill.md` - Indexer guidance
- `.opencode/frontend-skill.md` - Frontend guidance
- `.opencode/socket-service-skill.md` - Socket-service guidance
- `.opencode/dong-service-skill.md` - Dong-service guidance
- Project has 3 Go services with `.golangci.yaml` linting
- Frontend uses ESLint, Prettier, shadcn/ui

## Working Rules

- Prefer changing only the relevant service for the request.
- Treat `uiux/` as reference material, not production frontend code.
- When backend responses change, update frontend types and rendering in the same task.
- When schema changes are made in Go services, check migration, model, repository, handler, and Swagger alignment.

## Commands

```bash
# All services
docker compose up --build

# Indexer
cd indexer
go build -o main -tags=production
./main orchestrator

# Frontend
cd frontend
npm run dev
npm run lint
npm run build

# Socket service
cd socket-service
go run main.go

# Dong service
cd dong-service
make build
make run
make test
```

## Guidelines

- Always check `AGENTS.md` for detailed rules
- Run linting before committing (golangci-lint for Go, npm run lint for frontend)
- Never commit secrets or credentials
- Keep PRs service-focused when possible
