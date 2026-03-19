# Socket Service Agents Guide

## Scope

This folder is the real-time websocket service. Prefer changes limited to `socket-service/` unless event payload contracts require coordination with other services.

## What Lives Here

- `handlers/` - websocket and HTTP handlers
- `service/` - connection and room management
- `repository/` - event persistence
- `middleware/` - auth and request logging
- `database/` - PostgreSQL, Redis, migrations
- `routers/` - route registration

## Working Rules

- Keep connection lifecycle and room membership logic thread-safe
- Verify both online delivery and offline persistence flows when changing events
- Be careful with auth middleware and Redis whitelist behavior
- Keep API and websocket payloads aligned with clients
- Use zerolog-based structured logs

## Commands

```bash
go mod tidy
go run main.go
go run main.go -f config/config.yml
```

## Verify Before Finish

```bash
go test ./...
golangci-lint run
```
