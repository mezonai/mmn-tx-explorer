# CLAUDE.md

This file provides Claude Code with project-specific context and instructions.

## Project Overview

Mezon Mainnet Transaction Explorer - a blockchain transaction indexing and exploration platform with 4 main services.

## Quick Reference

| Service | Tech Stack | Key Features |
|---------|------------|--------------|
| indexer | Go, Cobra, PostgreSQL | Block sync, transaction parsing |
| frontend | Next.js 15, TypeScript, React 19 | Block explorer, P2P, lucky money |
| socket-service | Go, Gin, WebSocket | Real-time events |
| dong-service | Go 1.25, Gin | Donation, lucky money, P2P trading |

## Important Files

- `agents.md` - General rules for all AI assistants
- Project has 3 Go services with `.golangci.yaml` linting
- Frontend uses ESLint, Prettier, shadcn/ui

## Commands

```bash
# All services
docker compose up --build

# Indexer
cd indexer && go build -o main -tags=production && ./main orchestrator

# Frontend
cd frontend && npm run dev

# Dong service
cd dong-service && make build && make run
```

## Guidelines

- Always check `agents.md` for detailed rules
- Run linting before committing (golangci-lint for Go, npm run lint for frontend)
- Never commit secrets or credentials
