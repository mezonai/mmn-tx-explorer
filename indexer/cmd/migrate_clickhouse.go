package cmd

import (
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/migration"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var migrateClickHouseCmd = &cobra.Command{
	Use:   "migrate-clickhouse",
	Short: "Run ClickHouse database migrations",
	Long:  `Run ClickHouse database migrations to update the schema to the latest version.`,
	Run: func(cmd *cobra.Command, args []string) {
		migrationsPath := migration.GetMigrationsPath("clickhouse")

		// Load config
		if err := config.LoadConfig(cfgFile); err != nil {
			log.Fatal().Err(err).Msg("Failed to load config")
		}

		if config.Cfg.Storage.Main.ClickHouse == nil {
			log.Fatal().Msg("ClickHouse storage is not configured")
		}

		if err := migration.RunClickHouseMigrations(config.Cfg.Storage.Main.ClickHouse, migrationsPath); err != nil {
			migration.LogMigrationError("ClickHouse", err)
		} else {
			migration.LogMigrationSuccess("ClickHouse")
		}
	},
}

func init() {
	rootCmd.AddCommand(migrateClickHouseCmd)
}
