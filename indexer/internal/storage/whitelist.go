package storage

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func init() {
	var err error

	db, err = sql.Open("sqlite3", "./whitelist.db")
	if err != nil {
		log.Fatalf("Failed to connect to SQLite database: %v", err)
	}


	createTable := `
	CREATE TABLE IF NOT EXISTS whitelist (
		token_id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		expiry DATETIME NOT NULL
	);`
	if _, err = db.Exec(createTable); err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}
}

func Set(tokenID, userID string, ttl time.Duration) error {
	expiry := time.Now().Add(ttl)
	query := `INSERT INTO whitelist (token_id, user_id, expiry) VALUES (?, ?, ?)`
	_, err := db.Exec(query, tokenID, userID, expiry)
	return err
}

func Get(tokenID string) (bool, string, error) {
	query := `SELECT user_id, expiry FROM whitelist WHERE token_id = ?`
	row := db.QueryRow(query, tokenID)

	var userID string
	var expiry time.Time
	if err := row.Scan(&userID, &expiry); err != nil {
		if err == sql.ErrNoRows {
			return false, "", nil
		}
		return false, "", err
	}

	if time.Now().After(expiry) {
		_ = Delete(tokenID)
		return false, "", nil
	}
	return true, userID, nil
}

func Delete(tokenID string) error {
	query := `DELETE FROM whitelist WHERE token_id = ?`
	_, err := db.Exec(query, tokenID)
	return err
}
