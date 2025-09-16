package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thirdweb-dev/indexer/internal/migration"
)

var (
	migrateClickhouseCmd = &cobra.Command{
		Use:   "migrate-clickhouse",
		Short: "Run ClickHouse database migrations",
		Long:  "Run ClickHouse database migrations to set up the required tables and views",
		Run: func(cmd *cobra.Command, args []string) {
			RunMigrate(cmd, args)
		},
	}
)

func RunMigrate(cmd *cobra.Command, args []string) {
	// Get migrations path using common function
	migrationsPath := migration.GetMigrationsPath("clickhouse")
	
	if err := migration.RunMigrationsFromConfig(migrationsPath); err != nil {
		migration.LogMigrationError("ClickHouse", err)
	}
	
	migration.LogMigrationSuccess("ClickHouse")
}
