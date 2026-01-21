# Intermediary Wallet Cleanup Script

A Go script to identify and clean up corrupted intermediary wallets (wallets with invalid encrypted private keys) and their related database records.

## Configuration

Update the constants in `main.go` (lines 17-28) before running:

```go
// Database connection
DB_HOST     = "db_host"       // Database host
DB_PORT     = "db_port"       // Database port
DB_USERNAME = "db_username"   // Database username
DB_PASSWORD = "db_password"   // Database password
DB_NAME     = "db_name"       // Database name
DB_SSLMODE  = "db_sslmode"    // SSL mode (disable/require/verify-full)
DB_SCHEMA   = "db_schema"     // Database schema name

// AES-256 encryption key (Base64 encoded, 32 bytes)
AES_SECRET_KEY = "aes_secret_key"
```

## Run Modes

### 1. Dry-Run Mode (Preview Only)
```bash
go run ./scripts/intermediary_wallet_cleanup --dry-run
```
- **Safe mode** - no changes to database
- Shows what records would be affected
- Use this first to preview the cleanup impact

### 2. Smart Delete Mode (Default)
```bash
go run ./scripts/intermediary_wallet_cleanup
```
- **Recommended mode** for production use
- **READY wallets**: Hard deleted (no related records exist)
- **IN_USE wallets**: Soft deleted
  - Wallet status → `DISABLED`
  - Red envelopes → `FAILED`
  - Offers → `CANCELED`
- Preserves data integrity by keeping related records

### 3. Force Delete Mode (Cascade)
```bash
go run ./scripts/intermediary_wallet_cleanup --force
```
- **Destructive mode** - use with caution
- Hard deletes all corrupted wallets and **cascades to all related records**:
  - `red_envelope` and children (`red_envelope_claim`, `red_envelope_split_money`)
  - `offers` and children (`orders`)
  - `intermediary_wallet`
- Use only when you need to completely remove all traces

## How It Works

1. Connects to PostgreSQL database
2. Scans all `intermediary_wallet` records
3. Validates each by attempting to decrypt the `encrypted_private_key` using the provided AES key
4. Identifies corrupted wallets (failed decryption)
5. Takes action based on the selected mode
6. Displays summary statistics