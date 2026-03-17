# Socket Service Skill

## Overview
Real-time WebSocket service for broadcasting events to clients.

## Tech Stack
- Go 1.23 with Gin framework
- Gorilla WebSocket
- Redis for token whitelist
- PostgreSQL for event storage
- golangci-lint for linting

## Directory Structure
```
socket-service/
├── config/        # Configuration loading (Viper)
├── constant/     # Constants
├── database/      # PostgreSQL and Redis connections
├── handlers/     # HTTP and WebSocket handlers
├── middleware/   # Auth and logging middleware
├── migrations/   # SQL migrations
├── models/       # Data models
├── repository/   # Database repositories
├── routers/      # Route definitions
├── service/      # Business logic (WebSocket manager)
├── utils/        # Utilities
└── logger/       # Logging (zerolog)
```

## Commands
```bash
cd socket-service
go mod tidy
go run main.go
# or with custom config
go run main.go -f config/config.yml

# Test
go test ./... -v              # All tests
go test ./handlers -v         # Single package
go test ./handlers -run '^TestName$' -v  # Single test

# Lint & Format
golangci-lint run
gofmt -w .    # Format all files
```

## Code Style
- Use `go fmt` for formatting
- Run `golangci-lint` before committing
- Use zerolog for logging
- Add error handling for all operations
- Follow Go naming conventions

## Configuration
- Config: `config/config.yml`
- Linting: `.golangci.yaml`

## Verification
- Run `go test ./...` after changing handlers, middleware, repository, or service logic
- Run `golangci-lint run` when touching production Go code
- Verify auth middleware, Redis whitelist access, and websocket connection flow together when changing event delivery

## API Endpoints
- `GET /ws/connect` - WebSocket connection endpoint
- `POST /api/event` - Save event (push to online users or store if offline)

## Key Components
- **WebSocket Handler**: Handles connection upgrades, ping/pong, room management
- **HTTP Handler**: Saves events, pushes to online users via WebSocket
- **Service**: Connection manager with thread-safe operations for rooms and user connections
- **Middleware**: JWT token validation and API key validation

## WebSocket Features
- Connection tracking with user ID mapping
- Room management (join/leave rooms)
- Event broadcasting to rooms
- Online/offline event handling
- Heartbeat/ping-pong for connection health
- Offline persistence fallback in PostgreSQL when receivers are disconnected
