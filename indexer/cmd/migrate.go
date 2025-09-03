package cmd

import (
	"path/filepath"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/thirdweb-dev/indexer/internal/migration"
	"os"
)

var (
	migrateCmd = &cobra.Command{
		Use:   "migrate",
		Short: "Run ClickHouse database migrations",
		Long:  "Run ClickHouse database migrations to set up the required tables and views",
		Run: func(cmd *cobra.Command, args []string) {
			RunMigrate(cmd, args)
		},
	}
)

func RunMigrate(cmd *cobra.Command, args []string) {
	log.Info().Msg("Running ClickHouse migrations...")
	
	// Check if we're running in Docker and use appropriate migrations path
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		// Default path for local development
		cwd, _ := os.Getwd()
		log.Debug().Str("cwd", cwd).Msg("Current working directory")
		
		joinedPath := filepath.Join(cwd, "internal", "tools", "clickhouse")
		log.Debug().Str("joined_path", joinedPath).Msg("Joined path")
		
		// Convert to forward slashes and use file:// URL with two slashes
		absPath, _ := filepath.Abs(joinedPath)
		slashPath := filepath.ToSlash(absPath)
		log.Debug().Str("slash_path", slashPath).Msg("Absolute path with forward slashes")
		
		migrationsPath = "file://" + slashPath
	} else {
		// Use the path from environment variable (for Docker)
		log.Debug().Str("migrations_path", migrationsPath).Msg("Using migrations path from environment")
	}
	
	log.Debug().Str("migrations_path", migrationsPath).Msg("Final migrations path")
	
	if err := migration.RunMigrationsFromConfig(migrationsPath); err != nil {
		log.Fatal().Err(err).Msg("Failed to run ClickHouse migrations")
	}
	
	log.Info().Msg("ClickHouse migrations completed successfully")
}
