package migration

import (
	"database/sql"
	"fmt"

	_ "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/golang-migrate/migrate/v4/database/clickhouse"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/rs/zerolog/log"
)

// Config holds migration configuration
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	Database string
	TLS      bool
}

// LoadConfigFromEnv loads migration config from environment variables
func LoadConfigFromEnv() *Config {
	return &Config{
		Host:     getEnvOrDefault("STORAGE_MAIN_CLICKHOUSE_HOST", "localhost"),
		Port:     getEnvOrDefaultInt("STORAGE_MAIN_CLICKHOUSE_PORT", 9440),
		Username: getEnvOrDefault("STORAGE_MAIN_CLICKHOUSE_USERNAME", "admin"),
		Password: getEnvOrDefault("STORAGE_MAIN_CLICKHOUSE_PASSWORD", "password"),
		Database: getEnvOrDefault("STORAGE_MAIN_CLICKHOUSE_DATABASE", "default"),
		TLS:      getEnvOrDefaultBool("STORAGE_MAIN_CLICKHOUSE_DISABLETLS", false),
	}
}
// RunMigrations executes all pending migrations
func RunMigrations(config *Config, migrationsPath string) error {
	// Create database connection string
	dsn := fmt.Sprintf("clickhouse://%s:%s@%s:%d/%s?dial_timeout=200ms&max_execution_time=60",
		config.Username,
		config.Password,
		config.Host,
		config.Port,
		config.Database,
	)

	if !config.TLS {
		dsn += "&secure=false"
	}

	log.Debug().Str("dsn", dsn).Msg("Connecting to ClickHouse for migration")

	// Open database connection
	db, err := sql.Open("clickhouse", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}
	defer db.Close()

	// Create driver instance
	driver, err := clickhouse.WithInstance(db, &clickhouse.Config{})
	if err != nil {
		return fmt.Errorf("failed to create clickhouse driver: %w", err)
	}

	// Use common migration runner
	return RunCommonMigrations(db, driver, "clickhouse", migrationsPath, "ClickHouse")
}


// RunMigrationsFromConfig runs migrations using configuration from environment variables
func RunMigrationsFromConfig(migrationsPath string) error {
	config := LoadConfigFromEnv()
	log.Debug().Interface("config", config).Msg("Loaded ClickHouse configuration")
	return RunMigrations(config, migrationsPath)
}
