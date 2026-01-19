package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// MigrationTracker tracks which migrations have been run
type MigrationTracker struct {
	db *sql.DB
}

// NewMigrationTracker creates a new migration tracker
func NewMigrationTracker(db *sql.DB) *MigrationTracker {
	return &MigrationTracker{db: db}
}

// InitMigrationsTable creates the migrations tracking table
func (mt *MigrationTracker) InitMigrationsTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		id SERIAL PRIMARY KEY,
		version VARCHAR(255) UNIQUE NOT NULL,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err := mt.db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	return nil
}

// IsMigrationApplied checks if a migration has already been applied
func (mt *MigrationTracker) IsMigrationApplied(version string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)`

	var exists bool
	err := mt.db.QueryRow(query, version).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check migration status: %w", err)
	}

	return exists, nil
}

// MarkMigrationApplied marks a migration as applied
func (mt *MigrationTracker) MarkMigrationApplied(version string) error {
	query := `INSERT INTO schema_migrations (version) VALUES ($1)`

	_, err := mt.db.Exec(query, version)
	if err != nil {
		return fmt.Errorf("failed to mark migration as applied: %w", err)
	}

	return nil
}

// RunMigrationsWithTracking runs all pending migrations with tracking
func RunMigrationsWithTracking() error {
	log.Println("Running database migrations with tracking...")

	// Initialize migration tracker
	tracker := NewMigrationTracker(DB)

	// Create migrations tracking table
	if err := tracker.InitMigrationsTable(); err != nil {
		return err
	}

	// Get migrations directory path
	migrationsDir := "migrations"

	// Check if migrations directory exists
	if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
		log.Printf("Migrations directory '%s' not found, skipping migrations", migrationsDir)
		return nil
	}

	// Read all .sql files from migrations directory
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		return fmt.Errorf("failed to read migration files: %w", err)
	}

	if len(files) == 0 {
		log.Println("No migration files found")
		return nil
	}

	// Sort files to ensure they run in order
	sort.Strings(files)

	// Execute each migration file
	pendingCount := 0
	for _, file := range files {
		// Extract version from filename (e.g., "001_create_donation_campaign_table.sql" -> "001_create_donation_campaign_table")
		filename := filepath.Base(file)
		version := strings.TrimSuffix(filename, filepath.Ext(filename))

		// Check if migration has already been applied
		applied, err := tracker.IsMigrationApplied(version)
		if err != nil {
			return err
		}

		if applied {
			log.Printf("Migration %s already applied, skipping", filename)
			continue
		}

		log.Printf("Running migration: %s", filename)

		// Read migration file
		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file, err)
		}

		// Execute migration
		_, err = DB.Exec(string(content))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", file, err)
		}

		// Mark migration as applied
		if err := tracker.MarkMigrationApplied(version); err != nil {
			return err
		}

		log.Printf("Migration %s completed successfully", filename)
		pendingCount++
	}

	if pendingCount == 0 {
		log.Println("No pending migrations to run")
	} else {
		log.Printf("Successfully applied %d migration(s)", pendingCount)
	}

	return nil
}
