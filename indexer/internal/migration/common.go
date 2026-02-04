package migration

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/rs/zerolog/log"
)

// CommonConfig holds common configuration fields for both ClickHouse and PostgreSQL
type CommonConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	Database string
}

// createFileURL creates a proper file:// URL from a file path, handling Windows paths correctly
func createFileURL(path string) string {
	// If already starts with file:// then return as is (avoid double prefix)
	if strings.HasPrefix(path, "file://") {
		return path
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return path
	}

	// Convert to forward slashes for URL
	urlPath := filepath.ToSlash(absPath)

	// On Windows, handle drive letter paths correctly
	if runtime.GOOS == "windows" {
		// Windows absolute paths start with drive letter (e.g., C:\)
		// For file URLs, we need file:///C:/path/to/file format (three slashes)
		if len(urlPath) > 1 && urlPath[1] == ':' {
			// Ensure we have the correct format: file:///C:/path
			return "file:///" + urlPath
		}
	}

	return "file://" + urlPath
}

// GetMigrationsPath returns the migrations path, handling both local and Docker environments
func GetMigrationsPath(defaultPath string) string {
	// Check if we're running in Docker and use appropriate migrations path
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		// Default path for local development
		cwd, _ := os.Getwd()
		log.Debug().Str("cwd", cwd).Msg("Current working directory")

		joinedPath := filepath.Join(cwd, "internal", "tools", defaultPath)
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
	return migrationsPath
}

// getEnvOrDefault returns the value of an environment variable or a default value if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvOrDefaultInt returns the value of an environment variable as int or a default value if not set
func getEnvOrDefaultInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := fmt.Sscanf(value, "%d", &defaultValue); err == nil && intValue == 1 {
			return defaultValue
		}
	}
	return defaultValue
}

// logMigrationStart logs the start of migration process
func logMigrationStart(dbType string) {
	log.Info().Str("database_type", dbType).Msg("Starting database migrations...")
}

// LogMigrationSuccess logs successful completion of migrations
func LogMigrationSuccess(dbType string) {
	log.Info().Str("database_type", dbType).Msg("Database migrations completed successfully")
}

// LogMigrationError logs migration errors
func LogMigrationError(dbType string, err error) {
	log.Fatal().Str("database_type", dbType).Err(err).Msg("Failed to run database migrations")
}

// RunCommonMigrations executes migrations using a common pattern
func RunCommonMigrations(
	db *sql.DB,
	driver database.Driver,
	driverName string,
	migrationsPath string,
	dbType string,
) error {
	logMigrationStart(dbType)

	// Test connection
	log.Debug().Msg("Testing database connection...")
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}
	log.Debug().Msg("Database connection successful")

	// Ensure migrationsPath is normalized into proper file:// URL
	log.Debug().Str("input_path", migrationsPath).Msg("Processing migrations path")
	sourceURL := createFileURL(migrationsPath)
	log.Debug().Str("source", sourceURL).Msg("Using migration source")

	// Create migrate instance
	log.Debug().Msg("Creating migrate instance...")
	m, err := migrate.NewWithDatabaseInstance(sourceURL, driverName, driver)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	log.Debug().Msg("Migrate instance created successfully")
	defer func() {
		if sourceErr, dbErr := m.Close(); sourceErr != nil || dbErr != nil {
			log.Error().Err(sourceErr).Err(dbErr).Msg("Error closing migrate instance")
		}
	}()

	// Get current version
	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return fmt.Errorf("failed to get current migration version: %w", err)
	}

	if dirty {
		log.Warn().Uint("version", version).Msg("Database is in dirty state, attempting to force previous version to retry")
		// Force the previous version so we can retry the failed migration
		prevVersion := int(version) - 1
		if prevVersion < 0 {
			prevVersion = 0
		}
		if migrateErr := m.Force(prevVersion); migrateErr != nil {
			return fmt.Errorf("failed to force version %d: %w", prevVersion, migrateErr)
		}
	}

	log.Info().Uint("current_version", version).Msg("Current migration version")

	// Run migrations
	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	if err == migrate.ErrNoChange {
		log.Info().Msg("No new migrations to apply")
	} else {
		newVersion, _, err := m.Version()
		if err != nil {
			return fmt.Errorf("failed to get new migration version: %w", err)
		}
		log.Info().Uint("new_version", newVersion).Msg("Migrations completed successfully")
	}

	return nil
}
