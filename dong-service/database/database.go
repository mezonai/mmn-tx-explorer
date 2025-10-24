package database

import (
	"database/sql"
	"dong-service/config"
	"dong-service/logger"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDatabase(cfg *config.DatabaseConfig) error {
	var err error

	logger.Info().
		Str("host", cfg.Host).
		Str("port", cfg.Port).
		Str("database", cfg.Name).
		Str("schema", cfg.Schema).
		Msg("Initializing database connection")

	dsn := cfg.GetDSN()

	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to open database connection")
		return fmt.Errorf("failed to open database: %w", err)
	}

	schema := cfg.Schema
	_, err = DB.Exec(fmt.Sprintf(`CREATE SCHEMA IF NOT EXISTS %s`, schema))
	if err != nil {
		logger.Error().Err(err).Str("schema", schema).Msg("Failed to create schema")
		return fmt.Errorf("failed to create schema: %w", err)
	}

	_, err = DB.Exec(fmt.Sprintf(`SET search_path TO %s`, schema))
	if err != nil {
		logger.Error().Err(err).Str("schema", schema).Msg("Failed to set schema")
		return fmt.Errorf("failed to set schema: %w", err)
	}

	// Test connection
	if err := DB.Ping(); err != nil {
		logger.Error().Err(err).Msg("Failed to ping database")
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Set connection pool settings
	DB.SetMaxOpenConns(cfg.MaxOpenConns)
	DB.SetMaxIdleConns(cfg.MaxIdleConns)

	// Set connection lifetime settings if configured
	if cfg.ConnMaxLifetime > 0 {
		DB.SetConnMaxLifetime(time.Duration(cfg.ConnMaxLifetime) * time.Second)
	}
	if cfg.ConnMaxIdleTime > 0 {
		DB.SetConnMaxIdleTime(time.Duration(cfg.ConnMaxIdleTime) * time.Second)
	}

	logger.Info().
		Int("max_open_conns", cfg.MaxOpenConns).
		Int("max_idle_conns", cfg.MaxIdleConns).
		Msg("Database connected successfully")

	// Run migrations with tracking
	if err := RunMigrationsWithTracking(); err != nil {
		logger.Error().Err(err).Msg("Failed to run database migrations")
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

func GetDB() *sql.DB {
	return DB
}

func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
