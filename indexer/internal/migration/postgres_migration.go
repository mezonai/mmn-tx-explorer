package migration

import (
	"database/sql"
	"fmt"

	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
	"github.com/rs/zerolog/log"
)

// ConfigPostgres holds migration configuration for Postgres
type ConfigPostgres struct {
	Host     string
	Port     int
	Username string
	Password string
	Database string
	SSLMode  string
}

// LoadPostgresConfigFromEnv loads Postgres config from environment variables
func LoadPostgresConfigFromEnv() *ConfigPostgres {
	return &ConfigPostgres{
		Host:     getEnvOrDefault("STORAGE_MAIN_POSTGRES_HOST", "localhost"),
		Port:     getEnvOrDefaultInt("STORAGE_MAIN_POSTGRES_PORT", 5432),
		Username: getEnvOrDefault("STORAGE_MAIN_POSTGRES_USERNAME", "admin"),
		Password: getEnvOrDefault("STORAGE_MAIN_POSTGRES_PASSWORD", "password"),
		Database: getEnvOrDefault("STORAGE_MAIN_POSTGRES_DATABASE", "indexer"),
		SSLMode:  getEnvOrDefault("STORAGE_MAIN_POSTGRES_SSLMODE", "disable"),
	}
}

// RunPostgresMigrations executes all pending migrations for Postgres
func RunPostgresMigrations(cfg *ConfigPostgres, migrationsPath string) error {
	// Build DSN
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Database,
		cfg.SSLMode,
	)

	log.Debug().Str("dsn", dsn).Msg("Connecting to Postgres for migration")

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}
	defer func() {
		err := db.Close()
		if err != nil {
			log.Error().Err(err).Msg("Failed to close database connection in RunPostgresMigrations")
		}
	}()

	// Create driver instance
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create postgres driver: %w", err)
	}

	// Use common migration runner
	return RunCommonMigrations(db, driver, "postgres", migrationsPath, "PostgreSQL")
}
