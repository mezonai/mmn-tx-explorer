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
	logger.Info().
		Str("host", cfg.Host).
		Str("port", cfg.Port).
		Str("database", cfg.Name).
		Str("schema", cfg.Schema).
		Msg("Initializing database connection")

	if err := CreateSchema(cfg); err != nil {
		logger.Error().Err(err).Msg("Failed to create schema")
		return fmt.Errorf("failed to create schema: %w", err)
	}

	var dbErr error
	dsn := cfg.GetDSN()
	DB, dbErr = sql.Open("postgres", dsn)
	if dbErr != nil {
		logger.Error().Err(dbErr).Msg("Failed to open database connection")
		return fmt.Errorf("failed to open database: %w", dbErr)
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

func CreateSchema(cfg *config.DatabaseConfig) error {
	db, err := sql.Open("postgres", cfg.GetDSNWithoutSchema())
	if err != nil {
		logger.Error().Err(err).Msg("Failed to open database connection")
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if connectErr := db.Ping(); connectErr != nil {
		logger.Error().Err(connectErr).Msg("Failed to ping database")
		return fmt.Errorf("failed to connect to database: %w", connectErr)
	}

	// Create schema
	_, err = db.Exec(fmt.Sprintf(`CREATE SCHEMA IF NOT EXISTS %s`, cfg.Schema))
	if err != nil {
		logger.Error().Err(err).Str("schema", cfg.Schema).Msg("Failed to create schema")
		return fmt.Errorf("failed to create schema: %w", err)
	}
	defer func() {
		if err != nil {
			errClose := db.Close()
			if errClose != nil {
				logger.Error().Err(errClose).Msg("Failed to close database connection")
			}
		}
	}()

	logger.Info().Str("schema", cfg.Schema).Msg("Schema created successfully")

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
