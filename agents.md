# Agents Rules

## Project Overview

Mezon Mainnet Transaction Explorer - a blockchain transaction indexing and exploration platform.

## Project Structure

```
mmn-tx-explorer/
├── indexer/           # Go-based blockchain indexer (sync data from blockchain)
├── frontend/          # Next.js frontend
├── socket-service/    # WebSocket service
├── dong-service/      # Backend: donation campaign, lucky money (lì xì), P2P trading
├── prove-service/     # Proof verification service
├── uiux/              # UI/UX static HTML designs (incomplete)
└── test/              # Test files
```

## Services Overview

### 1. Indexer (Go)
- **Purpose**: Sync data from blockchain to PostgreSQL
- **Tech Stack**: Go, Cobra CLI, PostgreSQL (3 DBs: orchestrator, staging, main), Kafka, Prometheus
- **Key Features**: Block indexing, transaction parsing, balance tracking, reorg handling

### 2. Frontend (Next.js)
- **Purpose**: Web interface for transaction explorer
- **Tech Stack**: Next.js 15, TypeScript, React 19, Tailwind CSS 4, shadcn/ui, TanStack Query
- **Key Features**: Block explorer, transaction details, P2P trading, lucky money, donation campaigns

### 3. Socket Service (Go)
- **Purpose**: Real-time WebSocket events
- **Tech Stack**: Go, Gin, Gorilla WebSocket, Redis, PostgreSQL
- **Key Features**: WebSocket connections, room management, event broadcasting

### 4. Dong Service (Go)
- **Purpose**: Main backend for core features
- **Tech Stack**: Go 1.25, Gin, PostgreSQL, Redis, JWT, ZK proofs
- **Key Features**:
  - Donation campaigns
  - Lucky money (lì xì)
  - P2P trading
  - Wallet management
  - Scheduler jobs

## Commands

### All Services (Docker)
```bash
docker compose up --build
```

### Indexer
```bash
cd indexer
docker-compose up -d postgres
go build -o main -tags=production

# Database
./main migrate-postgres

# Run indexer
./main orchestrator   # Start block indexer
./main api            # Start API server

# Other commands
./main sync_blocks    # Sync blocks
./main validate       # Validate block range
./main validate_and_fix  # Validate and fix
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install  # or yarn

# Development
npm run dev

# Build
npm run build

# Lint & Format
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Socket Service
```bash
cd socket-service
go mod tidy
go run main.go
# or with custom config
go run main.go -f config/config.yml
```

### Dong Service
```bash
cd dong-service

# Using Makefile
make build
make run
make test
make swagger

# Direct
go build -o main .
go run main.go
```

## Environment Setup

```bash
# Database
cp .env.example .env

# Indexer
cp indexer/configs/config.example.yml indexer/configs/config.yml
cp indexer/configs/secrets.example.yml indexer/configs/secrets.yml
```

## Code Style

### Go (indexer, socket-service, dong-service)
- Follow Go standard formatting (`go fmt`)
- Use meaningful variable names
- Add error handling for all operations
- Run `golangci-lint` before committing (config: `.golangci.yaml`)
- Use zerolog for logging

### TypeScript/JavaScript (frontend)
- Use ESLint and Prettier
- Follow existing component patterns
- Use TypeScript types for all data structures
- Use shadcn/ui components
- Follow App Router conventions in `app/` directory
- Use modules in `modules/` for features

### General
- No secrets or keys in code
- Use environment variables for configuration
- Write tests for new features
- Document new API endpoints with Swagger

## Guidelines

- Always verify changes with lint/typecheck before completing
- Never commit secrets or credentials
- Follow existing code patterns in each service
- Document new API endpoints
- Run tests before committing (`make test` for Go, check package.json for frontend)
