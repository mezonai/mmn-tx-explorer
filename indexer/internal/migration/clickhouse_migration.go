package migration

import (
	"database/sql"
	"fmt"

	"github.com/golang-migrate/migrate/v4/database/clickhouse"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/rs/zerolog/log"
)

// RunClickHouseMigrations executes all pending migrations for ClickHouse
func RunClickHouseMigrations(cfg *config.ClickHouseConfig, migrationsPath string) error {
	sslMode := "false"
	if cfg.SSLMode == "enable" {
		sslMode = "true"
	}

	// Build DSN for ClickHouse driver
	dsn := fmt.Sprintf("clickhouse://%s:%s@%s:%d/%s?secure=%s&skip_verify=true",
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Database,
		sslMode,
	)

	log.Debug().Str("dsn", dsn).Msg("Connecting to ClickHouse for migration")

	db, err := sql.Open("clickhouse", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}
	defer func() {
		dbErr := db.Close()
		if dbErr != nil {
			log.Error().Err(dbErr).Msg("Failed to close database connection in RunClickHouseMigrations")
		}
	}()

	// Create driver instance
	driver, err := clickhouse.WithInstance(db, &clickhouse.Config{})
	if err != nil {
		return fmt.Errorf("failed to create clickhouse driver: %w", err)
	}

	// Use common migration runner
	return RunCommonMigrations(db, driver, "clickhouse", migrationsPath, "ClickHouse")
}
