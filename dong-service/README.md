# Dong Service - Donation Campaign API

A RESTful API service to manage donation campaigns, built with the Gin Gonic framework and PostgreSQL.

## 🚀 Features

- ✅ RESTful API using Gin Gonic
- ✅ PostgreSQL database with database/sql and lib/pq driver
- ✅ Repository pattern for the data access layer
- ✅ CRUD operations for donation campaign management
- ✅ Campaign status management (Draft/Active/Closed)
- ✅ Status filtering and ordering in the list API
- ✅ Swagger/OpenAPI documentation
- ✅ Docker & Docker Compose support
- ✅ YAML-based configuration with Viper
- ✅ Environment variable override support
- ✅ CORS middleware
- ✅ Custom logging middleware
- ✅ File-based database migrations
- ✅ Migration tracking system
- ✅ Pagination support
- ✅ **Security scanning with OSV Scanner & govulncheck**
- ✅ **Automated vulnerability detection via GitHub Actions**

## 📋 Requirements

- Go 1.24 or higher
- PostgreSQL 15
- Docker & Docker Compose (optional)

## 🛠️ Setup

### 1. Clone repository

```bash
cd dong-service
```

### 2. Install dependencies

```bash
go mod download
```

### 3. Configure environment

The application uses a YAML configuration file located at `config/config.yml`.

Edit the `config/config.yml` file with your configuration:

```yaml
# Server Configuration
server:
  host: 0.0.0.0
  port: 8888
  gin_mode: debug

# Database Configuration
database:
  host: localhost
  port: 5432
  user: postgres
  password: postgres
  name: dong_db
  sslmode: disable
  max_open_conns: 25
  max_idle_conns: 5

# CORS Configuration
cors:
  allow_origins: "*"
  allow_methods: "POST, OPTIONS, GET, PUT, DELETE, PATCH"
  allow_headers: "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With"
  allow_credentials: true
```

**Note:** Environment variables can override config file values using the format: `SERVER_HOST`, `DATABASE_PORT`, etc.

## 🚀 Run the application

### Using Docker Compose (recommended)

```bash
# Build and start all services
docker-compose up --build

# Or run in the background
docker-compose up -d

# Tail logs
docker-compose logs -f dong-service

# Stop services
docker-compose down
```

### Run directly with Go

1. Ensure PostgreSQL is running

2. Run the app:

```bash
# Development mode
make dev

# Or
go run main.go

# Production mode
make prod
```

### Using the Makefile

```bash
# Show all commands
make help

# Build application
make build

# Run application
make run

# Run tests
make test

# Generate Swagger docs
make swagger

# Security scanning
make install-security-tools  # Install security tools (first time only)
make security-scan          # Run all security scans
make govulncheck           # Run Go vulnerability check
make osv-scan              # Run OSV scanner

# Docker commands
make docker-build
make docker-up
make docker-down
make docker-logs
```

## 📡 API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Donation Campaign Management

#### Campaign Status

Each campaign has a status (`status`) with 3 values:
- **Draft (0)**: Default when creating a new campaign
- **Active (1)**: The campaign is active and accepting donations
- **Closed (2)**: The campaign is closed and no longer accepting donations

#### Endpoints

- `POST /api/v1/campaigns` - Create a new campaign (status = Draft)
- `GET /api/v1/campaigns` - List campaigns (with pagination, filter, sort)
- `GET /api/v1/campaigns/:id` - Get campaign by ID
- `PUT /api/v1/campaigns/:id` - Update campaign (cannot update status/wallet)
- `PATCH /api/v1/campaigns/:id/activate` - Activate campaign (Draft → Active)
- `PATCH /api/v1/campaigns/:id/close` - Close campaign (Active → Closed)

### Swagger Documentation

- `GET /swagger/index.html` - Swagger UI

## 📝 API Examples

### Create Campaign

```bash
curl -X POST http://localhost:8888/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Help Children in Need",
    "description": "Support education for underprivileged children",
    "goal": 1000000,
    "url": "https://example.com/campaign/1",
    "end_date": "2025-12-31",
    "donation_wallet": "0x1234567890abcdef",
    "creator": 1
  }'
```

**Note:** Status is automatically set to `Draft (0)` when creating a new campaign. You do not need to include the `status` field in the request.

### Get Campaign

```bash
curl http://localhost:8888/api/v1/campaigns/1
```

### List Campaigns (with pagination, filter, sort)

```bash
# Get all campaigns with pagination
curl "http://localhost:8888/api/v1/campaigns?page=1&limit=10"

# Filter by status (0=Draft, 1=Active, 2=Closed)
curl "http://localhost:8888/api/v1/campaigns?status=1&page=1&limit=10"

# Sort by created_at (asc/desc)
curl "http://localhost:8888/api/v1/campaigns?order=asc&page=1&limit=10"

# Combine filter and sort
curl "http://localhost:8888/api/v1/campaigns?status=1&order=desc&page=1&limit=10"
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by status (0=Draft, 1=Active, 2=Closed)
- `order`: Sort order (asc/desc, default: desc)

### Update Campaign

```bash
curl -X PUT http://localhost:8888/api/v1/campaigns/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Campaign Name",
    "description": "Updated description",
    "goal": 2000000,
    "url": "https://example.com/updated",
    "end_date": "2025-12-31"
  }'
```

**Note:** You cannot update `status` and `donation_wallet` via this endpoint. Use `/activate` or `/close` to change status.

### Activate Campaign

```bash
curl -X PATCH http://localhost:8888/api/v1/campaigns/1/activate
```

### Close Campaign

```bash
curl -X PATCH http://localhost:8888/api/v1/campaigns/1/close
```

## 📁 Project Structure

```
dong-service/
├── config/              # Configuration management
│   ├── config.go        # Configuration loader using Viper
│   └── config.yml       # YAML configuration file
├── database/            # Database connection & migrations
│   ├── database.go      # Database initialization
│   └── migrations.go    # Migration tracking logic
├── handlers/            # HTTP request handlers
│   ├── health.go        # Health check handler
│   └── donation_campaign.go  # Campaign CRUD handlers
├── middleware/          # Custom middleware
│   ├── cors.go          # CORS middleware
│   └── logger.go        # Request logging middleware
├── models/              # Data models & DTOs
│   ├── donation_campaign.go  # Campaign model & DTOs
│   └── response.go      # API response structures
├── constants/           # Application constants
│   └── status.go        # Campaign status constants
├── repository/          # Data access layer (Repository pattern)
│   └── donation_campaign_repository.go  # Campaign repository
├── routes/              # Route definitions
│   └── routes.go        # API route setup
├── migrations/          # SQL migration files
│   └── 001_create_donation_campaign_table.sql
├── docs/                # Swagger documentation (auto-generated)
│   ├── docs.go
│   ├── swagger.json
│   └── swagger.yaml
├── main.go              # Application entry point
├── go.mod               # Go module dependencies
├── go.sum               # Go module checksums
├── Dockerfile           # Docker image definition
├── docker-compose.yml   # Docker compose configuration
├── Makefile             # Build automation
└── README.md            # This file
```

## 🔧 Development

### Configuration Management

The application uses **Viper** for configuration management with the following features:
- YAML-based configuration file (`config/config.yml`)
- Environment variable override support
- Format: `SERVER_HOST`, `DATABASE_PORT`, etc.

### Generate Swagger Documentation

```bash
# Install swag CLI
go install github.com/swaggo/swag/cmd/swag@latest

# Generate docs
swag init

# Or use make
make swagger
```

### Run Tests

```bash
go test -v ./...

# Or
make test
```

### Database Migration

The database will auto-migrate on application startup. SQL migrations are read from the `migrations/` directory and executed in order.

**Migration Tracking:**
- The system automatically tracks applied migrations in the `schema_migrations` table
- Each migration runs only once
- Already-applied migrations are skipped automatically

**Create a new migration:**
```bash
# Create a new migration file in the migrations/ directory
# Format: XXX_description.sql (e.g., 002_add_new_feature.sql)
touch migrations/002_add_new_feature.sql
```

**Run migrations:**
```bash
# Auto-run on app start
go run main.go
```

**Check migration status:**
```bash
# Query the database directly
psql -h localhost -U postgres -d dong_db -c "SELECT * FROM schema_migrations ORDER BY applied_at DESC;"
```

## 🐳 Docker

### Build Docker Image

```bash
docker build -t dong-service .
```

### Run with Docker

```bash
docker run -p 8888:8888 \
  -e SERVER_HOST=0.0.0.0 \
  -e SERVER_PORT=8888 \
  -e GIN_MODE=debug \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=dong_db \
  -e DB_SSLMODE=disable \
  -e DB_MAX_OPEN_CONNS=25 \
  -e DB_MAX_IDLE_CONNS=5 \
  dong-service
```

## 📊 Response Format

### Success Response

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2025-10-21T04:20:00Z",
    "updated_at": "2025-10-21T04:20:00Z"
  }
}
```

### Error Response

```json
{
  "code": 400,
  "message": "Invalid request data"
}
```

### Paginated Response

```json
{
  "code": 200,
  "message": "Success",
  "data": [...],
  "total": 100,
  "page": 1,
  "per_page": 10
}
```

## 🔐 Security

- CORS configuration
- Input validation with Gin binding
- SQL injection protection with prepared statements (database/sql)
- Status constants to avoid magic numbers
- Immutable fields (donation_wallet) after creation
- Proper error handling and logging
- **Automated vulnerability scanning** with OSV Scanner and govulncheck
- **GitHub Actions security workflows** for continuous monitoring
- **Weekly automated security scans** to detect new vulnerabilities

### Security Scanning

This project includes comprehensive security scanning tools:

```bash
# First-time setup (install security tools)
make install-security-tools

# Or use automated scripts
./scripts/setup-security.sh      # Linux/macOS
.\scripts\setup-security.ps1     # Windows

# Run security scans
make security-scan               # Run all scans
make govulncheck                # Go vulnerability check only
make osv-scan                   # OSV scanner only
```

**Automated Security Checks:**
- ✅ Runs on every push to main/develop branches
- ✅ Runs on all pull requests
- ✅ Weekly scheduled scans (Monday 9:00 AM)
- ✅ Dependency review for PRs

See [SECURITY.md](SECURITY.md) for detailed security documentation.

## 📝 TODO

- [ ] Authentication & Authorization (JWT)
- [ ] Rate limiting
- [ ] Caching with Redis
- [ ] Unit tests
- [ ] Integration tests
- [x] Security scanning (OSV Scanner, govulncheck)
- [x] GitHub Actions CI/CD pipeline
- [ ] Monitoring & Logging
- [ ] API versioning

## 📄 License

MIT License

## 👥 Author

Mezon Team

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!

