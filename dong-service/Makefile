.PHONY: help build run test swagger

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the application
	go build -o main .

run: ## Run the application
	go run main.go

test: ## Run tests
	go test -v ./...

swagger: ## Generate swagger documentation
	swag init

