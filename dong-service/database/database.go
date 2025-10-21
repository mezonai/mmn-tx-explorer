package database

import (
	"database/sql"
	"dong-service/config"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDatabase(cfg *config.DatabaseConfig) error {
	var err error

	dsn := cfg.GetDSN()

	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Set connection pool settings
	DB.SetMaxOpenConns(cfg.MaxOpenConns)
	DB.SetMaxIdleConns(cfg.MaxIdleConns)

	log.Println("Database connected successfully")

	// Run migrations with tracking
	if err := RunMigrationsWithTracking(); err != nil {
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
