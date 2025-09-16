package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thirdweb-dev/indexer/internal/migration"
)

var (
	migratePostgresCmd = &cobra.Command{
		Use:   "migrate-postgres",
		Short: "Run PostgreSQL database migrations",
		Long:  "Run PostgreSQL database migrations to set up the required tables and schemas",
		Run: func(cmd *cobra.Command, args []string) {
			RunMigratePostgres(cmd, args)
		},
	}
)

func RunMigratePostgres(cmd *cobra.Command, args []string) {
	// Load configuration from environment
	config := migration.LoadPostgresConfigFromEnv()
	
	// Get migrations path using common function
	migrationsPath := migration.GetMigrationsPath("postgres")
	
	if err := migration.RunPostgresMigrations(config, migrationsPath); err != nil {
		migration.LogMigrationError("PostgreSQL", err)
	}
	
	migration.LogMigrationSuccess("PostgreSQL")
}
