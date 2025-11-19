# Insight

Insight is a high-performance, modular blockchain indexer and data API for EVM chains. It fetches, processes, and stores on-chain data—making it easy to query blocks, transactions, logs, token balances, and more via an HTTP API.

## 🚀 Getting Started

Quickstart (Local Development):

```bash
# 1. Copy example configs and secrets
cp configs/config.example.yml configs/config.yml
cp configs/secrets.example.yml configs/secrets.yml

# 2. Start dependencies (optional)
docker compose up -d postgres

# 3. Run PostgreSQL migrations for orchestrator/staging/main
go build -o main .
./main migrate-postgres

# 4. Start the indexer (orchestrator) and API
./main orchestrator
./main api

# API default: http://localhost:8080
```

### Quick Start with Example Config

```bash
# Use provided test configuration
./main orchestrator --config configs/test_config.yml
./main api --config configs/test_config.yml
```

Database Connections:
- PostgreSQL: localhost:5432 (orchestrator, staging, main)
- Credentials: admin / password

---

## 🏗 How It Works

Insight's architecture consists of five main components that work together to continuously index blockchain data:

### 1. **Poller** 
The Poller continuously fetches new blocks from the configured RPC endpoint. It uses multiple worker goroutines to concurrently retrieve block data, handles successful and failed results, and stores the processed block data and any failures in staging storage.

### 2. **Worker** 
The Worker processes batches of block numbers, fetching block data, logs, and traces (if supported) from the configured RPC. It divides the work into chunks, processes them concurrently, and returns the results as a collection of WorkerResult structures containing block data, transactions, logs, and traces for each processed block.

### 3. **Committer** 
The Committer periodically moves data from staging storage to main storage. It ensures blocks are committed sequentially, handling any gaps in the data, and updates various metrics while performing concurrent inserts of blocks, logs, transactions, and traces into the main storage.

### 4. **Failure Recoverer** 
The FailureRecoverer recovers from block processing failures. It periodically checks for failed blocks, attempts to reprocess them using a worker, and either removes successfully processed blocks from the failure list or updates the failure count for blocks that continue to fail.

### 5. **Orchestrator** 
The Orchestrator coordinates and manages the poller, failure recoverer, and committer. It initializes these components based on configuration settings and starts them concurrently, ensuring they run independently while waiting for all of them to complete their tasks.

### Data Flow
1. **Polling**: The Poller continuously checks for new blocks on the blockchain
2. **Processing**: Workers fetch and process block data, transactions, logs, and traces
3. **Staging**: Processed data is stored in staging storage for validation
4. **Commitment**: The Committer moves validated data to main storage
5. **Recovery**: Failed blocks are retried by the Failure Recoverer
6. **API**: The HTTP API serves queries from the main storage

### Work Modes
Insight operates in two distinct work modes that adapt based on distance from chain head:

**Backfill Mode** (Catching Up):
- Used when the indexer is significantly behind the latest block
- Processes blocks in large batches for maximum throughput
- Optimized for an error-free indexing process over speed
- Automatically switches to live mode when caught up

**Live Mode** (Real-time):
- Used when the indexer is close to the chain head (within ~500 blocks by default)
- Processes blocks as they arrive with minimal latency
- Optimized for real-time data availability
- Switches back to backfill mode if falling behind

The work mode threshold and check interval are configurable via `workMode.liveModeThreshold` and `workMode.checkIntervalMinutes`.

This modular architecture allows for adaptation to various EVM chains and use cases, with configurable batch sizes, delays, and processing strategies.

---

## ⚙️ Installation / Setup

### Prerequisites

- Go 1.23+
- PostgreSQL (Docker Compose included)
- Optional: Redis, Kafka, Prometheus, Grafana

### Environment Variables & Secrets

Insight supports configuration via environment variables in addition to YAML config and CLI flags.

**Environment Variable Naming Convention:**
- Use uppercase letters and underscores
- Nested YAML paths become underscore-separated variables
- Example: `rpc.url` becomes `RPC_URL`
- Example: `storage.main.postgres.host` becomes `STORAGE_MAIN_POSTGRES_HOST`

Common Environment Variables:

RPC Configuration:
```bash
RPC_URL=https://1.rpc.thirdweb.com
RPC_CHAIN_ID=1
RPC_BLOCKS_BLOCKS_PER_REQUEST=500
RPC_BLOCKS_BATCH_DELAY=100
RPC_LOGS_BLOCKS_PER_REQUEST=250
RPC_LOGS_BATCH_DELAY=100
RPC_BLOCKRECEIPTS_ENABLED=false
RPC_BLOCKRECEIPTS_BLOCKS_PER_REQUEST=250
RPC_BLOCKRECEIPTS_BATCH_DELAY=100
RPC_TRACES_ENABLED=false
RPC_TRACES_BLOCKS_PER_REQUEST=500
RPC_TRACES_BATCH_DELAY=100
RPC_MMNGRPCURL=localhost:9001
```

Storage Configuration (PostgreSQL):
```bash
STORAGE_MAIN_POSTGRES_HOST=postgres
STORAGE_MAIN_POSTGRES_PORT=5432
STORAGE_MAIN_POSTGRES_USERNAME=admin
STORAGE_MAIN_POSTGRES_PASSWORD=password
STORAGE_MAIN_POSTGRES_DATABASE=indexer
STORAGE_MAIN_POSTGRES_SSLMODE=disable

STORAGE_STAGING_POSTGRES_HOST=postgres
STORAGE_STAGING_POSTGRES_PORT=5432
STORAGE_STAGING_POSTGRES_USERNAME=admin
STORAGE_STAGING_POSTGRES_PASSWORD=password
STORAGE_STAGING_POSTGRES_DATABASE=indexer
STORAGE_STAGING_POSTGRES_SSLMODE=disable

STORAGE_ORCHESTRATOR_POSTGRES_HOST=postgres
STORAGE_ORCHESTRATOR_POSTGRES_PORT=5432
STORAGE_ORCHESTRATOR_POSTGRES_USERNAME=admin
STORAGE_ORCHESTRATOR_POSTGRES_PASSWORD=password
STORAGE_ORCHESTRATOR_POSTGRES_DATABASE=indexer
STORAGE_ORCHESTRATOR_POSTGRES_SSLMODE=disable
```

API Configuration:
```bash
API_HOST=localhost:8080
API_BASIC_AUTH_USERNAME=admin
API_BASIC_AUTH_PASSWORD=admin
API_THIRDWEB_CLIENT_ID=your-client-id
```

Logging Configuration:
```bash
LOG_LEVEL=info
LOG_PRETTIFY=true
LOG_FILEENABLED=true
LOG_FILEPATH=/app/logs/indexer.log
```

Poller Configuration:
```bash
POLLER_ENABLED=true
POLLER_INTERVAL=1000
POLLER_BLOCKS_PER_POLL=500
POLLER_FROM_BLOCK=0
POLLER_FORCE_FROM_BLOCK=false
POLLER_UNTIL_BLOCK=0
POLLER_PARALLEL_POLLERS=1
```

Complete Example:
```bash
# Set all configuration via environment variables
export RPC_URL="https://1.rpc.thirdweb.com"
export RPC_CHAIN_ID=1
export STORAGE_MAIN_POSTGRES_HOST="localhost"
export STORAGE_MAIN_POSTGRES_PASSWORD="password"
export API_BASIC_AUTH_USERNAME="admin"
export API_BASIC_AUTH_PASSWORD="admin"
export LOG_LEVEL="info"

# Run with env only
./main orchestrator
./main api
```

**Secrets Management:**
- For sensitive credentials, you can use environment variables instead of `configs/secrets.yml`
- Environment variables take precedence over config files
- See `configs/secrets.example.yml` for the complete structure

### Docker

- `docker-compose.yml` provides PostgreSQL, Redis (optional), Prometheus, and Grafana for local development.
- Exposes:
  - PostgreSQL: `localhost:5432`
  - Prometheus: `localhost:9090`
  - Grafana: `localhost:4000`
  - Redis: `localhost:6379`

### Database Migrations

- Run `./main migrate-postgres` to create required PostgreSQL tables/schemas.

---

## 💡 Usage

### CLI Commands

- Indexer (orchestrator): `./main orchestrator`
- API server: `./main api`
- Run PostgreSQL migrations: `./main migrate-postgres`
- Validate range: `./main validate <startBlock> [endBlock]`
- Validate and fix in batches: `./main validateAndFix [batchSize] [fixBatchSize]`
- Validation migration to temp DB: `./main validationMigration`

### API Endpoints

All endpoints are under `/{chainId}` and require HTTP Basic Auth.

- Blocks:
  - `GET /{chainId}/blocks`
  - `GET /{chainId}/blocks/{blockNumber}/detail`

- Transactions:
  - `GET /{chainId}/transactions`
  - `GET /{chainId}/transactions/{to}`
  - `GET /{chainId}/transactions/{to}/{signature}`
  - `GET /{chainId}/tx/{txHash}/detail`
  - `GET /{chainId}/pending-transactions`
  - `GET /{chainId}/pending-tx/{transaction_hash}/detail`
  - `GET /{chainId}/wallet-transactions/{wallet_address}`

- Wallets:
  - `GET /{chainId}/wallets`
  - `GET /{chainId}/wallets/{address}/detail`

- Tokens:
  - `GET /{chainId}/balances/{owner}/{type}`
  - `GET /{chainId}/balances/{owner}`
  - `GET /{chainId}/holders/{address}`
  - `GET /{chainId}/transfers`
  - `GET /{chainId}/tokens/{address}`

- Stats:
  - `GET /{chainId}/stats`

- Search:
  - `GET /{chainId}/search/{input}`

- Health:
  - `GET /health`

- Swagger/OpenAPI:
  - `GET /swagger/index.html`
  - `GET /openapi.json`

See the OpenAPI spec at `docs/swagger.yaml` for full details.

---

## 🛠 Configuration

Insight supports configuration via multiple methods with the following priority order:

1. Command-line flags (highest priority)
2. Environment variables
3. YAML config files (`configs/config.yml`)

### Configuration Methods

1) YAML Config Files (Recommended for Development):
```yaml
# configs/config.yml
rpc:
  url: https://1.rpc.thirdweb.com
  blocks:
    blocksPerRequest: 1000
    batchDelay: 0
  logs:
    blocksPerRequest: 400
    batchDelay: 100
  traces:
    enabled: false
    blocksPerRequest: 200
    batchDelay: 100

log:
  level: debug
  pretty: true

storage:
  main:
    postgres:
      host: postgres
      port: 5432
      database: indexer
      username: admin
      password: password
      sslMode: disable
```

2) Environment Variables (Recommended for Production):
```bash
# Set configuration via environment variables
export RPC_URL="https://1.rpc.thirdweb.com"
export RPC_BLOCKS_BLOCKS_PER_REQUEST=1000
export RPC_BLOCKS_BATCH_DELAY=0
export LOG_LEVEL="debug"
export LOG_PRETTIFY=true
export STORAGE_MAIN_POSTGRES_HOST="localhost"
export STORAGE_MAIN_POSTGRES_PASSWORD="password"
```

3) Command-line Flags:
```bash
# Override specific settings via CLI flags (examples)
./main orchestrator --rpc-url="https://1.rpc.thirdweb.com" --log-level=info
./main api --api-host=localhost:8080
```

### Environment Variable Reference

RPC Configuration:
| YAML Path | Environment Variable | Description | Default |
|-----------|---------------------|-------------|---------|
| `rpc.url` | `RPC_URL` | RPC endpoint URL | - |
| `rpc.chainId` | `RPC_CHAIN_ID` | Blockchain network ID | 1 |
| `rpc.blocks.blocksPerRequest` | `RPC_BLOCKS_BLOCKS_PER_REQUEST` | Blocks per RPC request | 500 |
| `rpc.blocks.batchDelay` | `RPC_BLOCKS_BATCH_DELAY` | Delay between batches (ms) | 100 |
| `rpc.logs.blocksPerRequest` | `RPC_LOGS_BLOCKS_PER_REQUEST` | Logs per RPC request | 250 |
| `rpc.logs.batchDelay` | `RPC_LOGS_BATCH_DELAY` | Log batch delay (ms) | 100 |
| `rpc.traces.enabled` | `RPC_TRACES_ENABLED` | Enable trace fetching | false |
| `rpc.traces.blocksPerRequest` | `RPC_TRACES_BLOCKS_PER_REQUEST` | Traces per RPC request | 500 |
| `rpc.blockReceipts.enabled` | `RPC_BLOCKRECEIPTS_ENABLED` | Enable block receipts | false |
| `rpc.blockReceipts.blocksPerRequest` | `RPC_BLOCKRECEIPTS_BLOCKS_PER_REQUEST` | Receipts per request | 250 |
| `rpc.blockReceipts.batchDelay` | `RPC_BLOCKRECEIPTS_BATCH_DELAY` | Receipts batch delay (ms) | 100 |
| `rpc.mmnGrpcUrl` | `RPC_MMNGRPCURL` | MMN gRPC URL | - |

Storage Configuration (PostgreSQL):
| YAML Path | Environment Variable | Description | Default |
|-----------|---------------------|-------------|---------|
| `storage.main.postgres.host` | `STORAGE_MAIN_POSTGRES_HOST` | Host | postgres |
| `storage.main.postgres.port` | `STORAGE_MAIN_POSTGRES_PORT` | Port | 5432 |
| `storage.main.postgres.username` | `STORAGE_MAIN_POSTGRES_USERNAME` | Username | admin |
| `storage.main.postgres.password` | `STORAGE_MAIN_POSTGRES_PASSWORD` | Password | password |
| `storage.main.postgres.database` | `STORAGE_MAIN_POSTGRES_DATABASE` | Database | indexer |
| `storage.main.postgres.sslMode` | `STORAGE_MAIN_POSTGRES_SSLMODE` | SSL mode | disable |

API Configuration:
| YAML Path | Environment Variable | Description | Default |
|-----------|---------------------|-------------|---------|
| `api.host` | `API_HOST` | API server host | localhost |
| `api.port` | - | API server port (combined in host) | - |
| `api.thirdweb.clientId` | `API_THIRDWEB_CLIENT_ID` | ThirdWeb client ID | - |
| `api.basicAuth.username` | `API_BASIC_AUTH_USERNAME` | API username | admin |
| `api.basicAuth.password` | `API_BASIC_AUTH_PASSWORD` | API password | admin |

Logging Configuration:
| YAML Path | Environment Variable | Description | Default |
|-----------|---------------------|-------------|---------|
| `log.level` | `LOG_LEVEL` | Log level (debug, info, warn, error) | debug |
| `log.prettify` | `LOG_PRETTIFY` | Pretty print logs | true |
| `log.fileEnabled` | `LOG_FILEENABLED` | Enable file logging | false |
| `log.filePath` | `LOG_FILEPATH` | Log file path | /app/logs/indexer.log |

Poller Configuration:
| YAML Path | Environment Variable | Description | Default |
|-----------|---------------------|-------------|---------|
| `poller.enabled` | `POLLER_ENABLED` | Enable block polling | true |
| `poller.interval` | `POLLER_INTERVAL` | Polling interval (ms) | 1000 |
| `poller.blocksPerPoll` | `POLLER_BLOCKS_PER_POLL` | Blocks per poll | 500 |
| `poller.fromBlock` | `POLLER_FROM_BLOCK` | Starting block number | 0 |
| `poller.forceFromBlock` | `POLLER_FORCE_FROM_BLOCK` | Force fromBlock | false |
| `poller.untilBlock` | `POLLER_UNTIL_BLOCK` | Until block | 0 |
| `poller.parallelPollers` | `POLLER_PARALLEL_POLLERS` | Parallel pollers | 1 |

### Configuration Best Practices

**Development:**
- Use YAML config files for easy configuration management
- Keep sensitive data in `configs/secrets.yml` (gitignored)

**Production:**
- Use environment variables for security and flexibility
- Set sensitive credentials via environment variables
- Use container orchestration secrets management

Docker/Kubernetes:
```yaml
# docker-compose.yml example
environment:
  - RPC_URL=https://1.rpc.thirdweb.com/your-client-id
  - STORAGE_MAIN_POSTGRES_HOST=postgres
  - STORAGE_MAIN_POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  - API_BASIC_AUTH_PASSWORD=${API_PASSWORD}
```

- See `configs/config.example.yml` and `configs/secrets.example.yml` for complete configuration options.
- All config options can be overridden by environment variables or CLI flags.

---

## 📁 Project Structure

```
indexer/
  api/           # API layer
  cmd/           # CLI commands (orchestrator, api, validation, etc.)
  configs/       # Config and secrets templates
  docs/          # Swagger/OpenAPI docs
  internal/
    common/      # Core blockchain models/utilities
    handlers/    # HTTP API handlers
    log/         # Logging setup
    metrics/     # Prometheus metrics
    middleware/  # API middleware (auth, CORS, logging)
    orchestrator/# Indexer orchestration logic
    publisher/   # Kafka publisher (optional)
    rpc/         # RPC client logic
    storage/     # Storage connectors
    tools/       # SQL migration scripts
    validation/  # Data validation logic
    worker/      # Block processing workers
  test/          # Mocks and test helpers
  main.go        # Entrypoint
  Dockerfile     # Container build
  docker-compose.yml
```

---

## 🤝 Contributing

1. **Fork & clone** the repo.
2. **Install dependencies:**  
   `go mod download`
3. **Start PostgreSQL:**  
   `docker compose up -d postgres`
4. **Apply migrations** (see above).
5. **Run tests:**  
   `go test ./...`
6. **Open a PR** with your changes!

---

## 🧪 Testing

- All core logic is covered by unit tests (see `test/` and `internal/handlers/*_test.go`).
- Run the full suite:
  ```bash
  go test ./...
  ```

---

## 📚 Documentation

- **API Reference:**  
  - [Swagger UI](http://localhost:8080/swagger/index.html) (when running)
  - [OpenAPI Spec](docs/swagger.yaml)
- **Metrics:**  
  - Prometheus metrics at [http://localhost:2112/metrics](http://localhost:2112/metrics)
  - See `internal/metrics/metrics.go` for all exposed metrics.
- **Architecture & Design:**  
  - See the top of this README and code comments for architectural details.

---

**License:** Apache 2.0
