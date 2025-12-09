# Socket Service Base Project

## Structure

- `main.go`: Entry point, server setup
- `handlers/websocket.go`: WebSocket connection handler
- `models/event.go`: Event struct (for future DB integration)

## Library
- [gorilla/websocket](https://github.com/gorilla/websocket)

## How to run
1. Install Go >= 1.18
2. `go mod tidy`
3. `go run main.go`

## References
- Gorilla WebSocket Chat Example: https://github.com/gorilla/websocket/tree/master/examples/chat
- Go WebSocket Server with Gin: https://dev.to/techschoolguru/build-a-realtime-chat-app-with-go-websockets-1p5g
