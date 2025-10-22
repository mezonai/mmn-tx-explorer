.PHONY: help build run test swagger security-scan osv-scan govulncheck install-security-tools

help: ## Show this help message
	@echo Available targets:
	@echo "  help                     - Show this help message"
	@echo "  build                    - Build the application"
	@echo "  run                      - Run the application"
	@echo "  test                     - Run tests"
	@echo "  swagger                  - Generate swagger documentation"
	@echo "  install-security-tools   - Install security scanning tools"
	@echo "  govulncheck              - Run Go vulnerability check"
	@echo "  osv-scan                 - Run OSV scanner"
	@echo "  security-scan            - Run all security scans"

build: ## Build the application
	go build -o main .

run: ## Run the application
	go run main.go

test: ## Run tests
	go test -v ./...

swagger: ## Generate swagger documentation
	swag init

install-security-tools: ## Install security scanning tools
	@echo Installing govulncheck...
	@go install golang.org/x/vuln/cmd/govulncheck@latest
	@echo Installing osv-scanner...
	@go install github.com/google/osv-scanner/cmd/osv-scanner@latest
	@echo Security tools installed successfully!

govulncheck: ## Run Go vulnerability check
	@echo Running govulncheck...
	@govulncheck ./...

osv-scan: ## Run OSV scanner
	@echo Running OSV scanner...
	@osv-scanner --lockfile=go.mod

security-scan: govulncheck osv-scan ## Run all security scans
	@echo All security scans completed!

