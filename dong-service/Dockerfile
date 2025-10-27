# Build stage
FROM golang:1.24.0-alpine AS builder

WORKDIR /app


# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o main .

# Final stage
FROM alpine:latest

WORKDIR /root/

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/main .
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

# Expose port
EXPOSE 8888

CMD ["./main"]