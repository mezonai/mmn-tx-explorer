package migration

import (
	"database/sql"
	"fmt"
	"path/filepath"
	"runtime"
	"strings"

	_ "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/clickhouse"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/rs/zerolog/log"
	"os"
	"strconv"
)

// Config holds migration configuration
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	Database string
	TLS      bool
}

// LoadConfigFromEnv loads migration config from viper
func LoadConfigFromEnv() *Config {
    portStr := os.Getenv("STORAGE_MAIN_CLICKHOUSE_PORT")
    port, err := strconv.Atoi(portStr)
    if err != nil {
        port = 9440
    }

    tlsStr := os.Getenv("STORAGE_MAIN_CLICKHOUSE_DISABLETLS")
    tls, err := strconv.ParseBool(tlsStr)
    if err != nil {
        tls = false
    }

	host := os.Getenv("STORAGE_MAIN_CLICKHOUSE_HOST")
	if host == "" {
		host = "localhost"
	}

	username := os.Getenv("STORAGE_MAIN_CLICKHOUSE_USERNAME")
	if username == "" {
		username = "admin"
	}

	password := os.Getenv("STORAGE_MAIN_CLICKHOUSE_PASSWORD")
	if password == "" {
		password = "password"
	}

	database := os.Getenv("STORAGE_MAIN_CLICKHOUSE_DATABASE")

	if database == "" {
		database = "default"
	}


    return &Config{
        Host:     host,
        Port:     port,
        Username: username,
        Password: password,
        Database: database,
        TLS:      tls,
    }
}
// RunMigrations executes all pending migrations
func RunMigrations(config *Config, migrationsPath string) error {
	log.Info().Msg("Starting ClickHouse migrations...")

	// Create database connection string
	dsn := fmt.Sprintf("clickhouse://%s:%s@%s:%d/%s?dial_timeout=200ms&max_execution_time=60",
		config.Username,
		config.Password,
		config.Host,
		config.Port,
		config.Database,
	)

	if !config.TLS {
		dsn += "&secure=false"
	}

	log.Debug().Str("dsn", dsn).Msg("Connecting to ClickHouse for migration")

	// Open database connection
	db, err := sql.Open("clickhouse", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}
	defer db.Close()

	// Test connection
	log.Debug().Msg("Testing database connection...")
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}
	log.Debug().Msg("Database connection successful")

	// Create driver instance
	log.Debug().Msg("Creating ClickHouse driver instance...")
	driver, err := clickhouse.WithInstance(db, &clickhouse.Config{})
	if err != nil {
		return fmt.Errorf("failed to create clickhouse driver: %w", err)
	}
	log.Debug().Msg("ClickHouse driver created successfully")

	// Ensure migrationsPath is normalized into proper file:// URL
	log.Debug().Str("input_path", migrationsPath).Msg("Processing migrations path")
	sourceURL := createFileURL(migrationsPath)
	log.Debug().Str("source", sourceURL).Msg("Using migration source")

	// Create migrate instance
	log.Debug().Msg("Creating migrate instance...")
	m, err := migrate.NewWithDatabaseInstance(sourceURL, "clickhouse", driver)
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
		log.Warn().Uint("version", version).Msg("Database is in dirty state, attempting to force version")
		if err := m.Force(int(version)); err != nil {
			return fmt.Errorf("failed to force version %d: %w", version, err)
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

// RunMigrationsFromConfig runs migrations using configuration from viper
func RunMigrationsFromConfig(migrationsPath string) error {
	config := LoadConfigFromEnv()
	fmt.Println("migrationsPath", config)
	return RunMigrations(config, migrationsPath)
}
