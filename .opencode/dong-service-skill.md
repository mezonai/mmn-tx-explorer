# Dong Service Skill

## Overview
Main backend service handling core features: donation campaigns, lucky money (lì xì), P2P trading, and wallet management.

## Tech Stack
- Go 1.25 with Gin framework
- PostgreSQL
- Redis for JWT token whitelist
- JWT authentication with OAuth2
- ZK (Zero-Knowledge) proof verification
- golangci-lint for linting

## Directory Structure
```
dong-service/
├── config/        # Configuration (Viper)
├── database/      # PostgreSQL and Redis connections
├── handlers/      # HTTP request handlers
├── middleware/    # Auth, CORS, rate limiting, ZK auth
├── models/       # Data models
├── repository/    # Data access layer
├── routes/       # API route definitions
├── services/     # Business logic
├── scheduler/    # Background jobs
├── constants/    # Constants (errors, event types, status, multipliers)
├── types/        # Custom types (BigInt string handling)
├── utils/        # Helpers (amount, crypto, json, etc.)
├── logger/       # Logging (zerolog + lumberjack)
├── blockchain/   # Blockchain integration
├── migrations/   # SQL migrations (001-028)
└── docs/         # Swagger documentation
```

## Commands
```bash
cd dong-service

# Using Makefile
make build        # Build the application
make run          # Run the application
make test         # Run tests
make swagger      # Generate Swagger docs
make help         # Show all available targets

# Security tools
make install-security-tools
make govulncheck
make osv-scan
make security-scan

# Direct
go build -o main .
go run main.go
```

## Code Style
- Use `go fmt` for formatting
- Run `golangci-lint` before committing
- Use zerolog with lumberjack for logging
- Add error handling for all operations
- Follow Go naming conventions

## Configuration
- Config: `config/config.yml`
- Linting: `.golangci.yaml`

## Verification
- Run `make test` after changing handlers, repositories, services, schedulers, or models
- Run `golangci-lint run` when touching production Go code
- Run `make swagger` when request/response models or route docs change
- If schema changes are introduced, verify migrations, repository scans, models, and frontend contracts together

## Key Features

### 1. Donation Campaigns
- Create and manage donation campaigns
- Track contributors and donations
- Feed aggregation

### 2. Lucky Money (Lì xì)
- Red envelope/gift money functionality
- Random distribution algorithms
- Expiry handling

### 3. P2P Trading
- P2P offer management
- Order management
- Trading execution

### 4. Wallet Management
- Wallet pool service
- User payment info
- Blockchain integration

### 5. Scheduler Jobs
- Cancel expired orders
- Red envelope expiry
- Sync contributors
- Wallet pool maintenance

## API Documentation
- Swagger docs auto-generated: `docs/swagger.json`, `docs/swagger.yaml`
- Generate with `make swagger`

## Security Features
- JWT authentication with OAuth2
- ZK proof verification
- Rate limiting middleware
- API key validation
- Token whitelist in Redis

## Working Notes
- Donation campaign, lucky money, and P2P features share service infrastructure but should stay modular in handlers/repository/services
- Be careful with monetary values and blockchain amounts; preserve precision and avoid narrowing types in API models
