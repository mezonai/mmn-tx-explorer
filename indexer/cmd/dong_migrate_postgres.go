package cmd

import (
	"fmt"
	"os"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/migration"
	"github.com/spf13/cobra"
)

var (
	dongMigratePostgresCmd = &cobra.Command{
		Use:   "dong-migrate-postgres",
		Short: "Run Dong PostgreSQL database migrations",
		Long:  " Dong PostgreSQL database migrations to set up the required tables and schemas",
		Run: func(cmd *cobra.Command, args []string) {
			RunDongMigratePostgres(cmd, args)
		},
	}
)

func RunDongMigratePostgres(cmd *cobra.Command, args []string) {
	// Load configuration from environment
	config := LoadPostgresConfigFromEnv()

	// Get migrations path using common function
	migrationsPath := migration.GetMigrationsPath("dong-postgres")

	if err := migration.RunPostgresMigrations(config, migrationsPath); err != nil {
		migration.LogMigrationError("PostgreSQL", err)
	}

	migration.LogMigrationSuccess("PostgreSQL")
}

func LoadPostgresConfigFromEnv() *migration.ConfigPostgres {
	return &migration.ConfigPostgres{
		Host:     getEnvOrDefault("STORAGE_MAIN_POSTGRES_HOST", "localhost"),
		Port:     getEnvOrDefaultInt("STORAGE_MAIN_POSTGRES_PORT", 5432),
		Username: getEnvOrDefault("STORAGE_MAIN_POSTGRES_USERNAME", "admin"),
		Password: getEnvOrDefault("STORAGE_MAIN_POSTGRES_PASSWORD", "password"),
		Database: getEnvOrDefault("STORAGE_MAIN_POSTGRES_DATABASE", "dong-services"),
		SSLMode:  getEnvOrDefault("STORAGE_MAIN_POSTGRES_SSLMODE", "disable"),
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvOrDefaultInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := fmt.Sscanf(value, "%d", &defaultValue); err == nil && intValue == 1 {
			return defaultValue
		}
	}
	return defaultValue
}
