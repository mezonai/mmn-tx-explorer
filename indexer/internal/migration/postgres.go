package migration

import (
    "os"
    "path/filepath"

    "github.com/rs/zerolog/log"
    config "github.com/thirdweb-dev/indexer/configs"
    "github.com/thirdweb-dev/indexer/internal/storage"
)

// runSQLFile reads a .sql file from disk and executes it against the provided connector.
func runSQLFile(conn *storage.PostgresConnector, path string) error {
    if conn == nil || conn.DB() == nil {
        return nil
    }
    sqlBytes, err := os.ReadFile(path)
    if err != nil {
        return err
    }
    _, err = conn.DB().Exec(string(sqlBytes))
    return err
}

// RunPostgresMigrations executes main, staging and orchestrator schemas if Postgres is configured.
func RunPostgresMigrations(baseDir string) error {
    // If no Postgres configured, skip
    if config.Cfg.Storage.Main.Postgres == nil && config.Cfg.Storage.Orchestrator.Postgres == nil && config.Cfg.Storage.Staging.Postgres == nil {
        log.Info().Msg("No Postgres storage configured; skipping Postgres migrations")
        return nil
    }

    // Prepare absolute base directory
    absBase := baseDir
    if !filepath.IsAbs(absBase) {
        cwd, _ := os.Getwd()
        absBase = filepath.Join(cwd, baseDir)
    }

    // Main storage migrations
    if cfg := config.Cfg.Storage.Main.Postgres; cfg != nil {
        conn, err := storage.NewPostgresConnector(cfg)
        if err != nil {
            return err
        }
        defer conn.Close()
        schemaPath := filepath.Join(absBase, "main_storage_schema.sql")
        log.Info().Str("path", schemaPath).Msg("Running main storage migrations (Postgres)")
        if err := runSQLFile(conn, schemaPath); err != nil {
            return err
        }
    }

    // Staging storage migrations
    if cfg := config.Cfg.Storage.Staging.Postgres; cfg != nil {
        conn, err := storage.NewPostgresConnector(cfg)
        if err != nil {
            return err
        }
        defer conn.Close()
        schemaPath := filepath.Join(absBase, "staging_schema.sql")
        log.Info().Str("path", schemaPath).Msg("Running staging storage migrations (Postgres)")
        if err := runSQLFile(conn, schemaPath); err != nil {
            return err
        }
    }

    // Orchestrator storage migrations
    if cfg := config.Cfg.Storage.Orchestrator.Postgres; cfg != nil {
        conn, err := storage.NewPostgresConnector(cfg)
        if err != nil {
            return err
        }
        defer conn.Close()
        schemaPath := filepath.Join(absBase, "orchestrator_schema.sql")
        log.Info().Str("path", schemaPath).Msg("Running orchestrator storage migrations (Postgres)")
        if err := runSQLFile(conn, schemaPath); err != nil {
            return err
        }
    }

    return nil
}



