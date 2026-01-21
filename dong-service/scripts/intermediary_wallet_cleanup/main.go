package main

import (
	"crypto/aes"
	"crypto/cipher"
	"database/sql"
	"encoding/base64"
	"errors"
	"flag"
	"fmt"
	"time"

	"github.com/lib/pq"
)

// CONFIG VALUES
const (
	// Database config
	DB_HOST     = "db_host"
	DB_PORT     = "db_port"
	DB_USERNAME = "db_username"
	DB_PASSWORD = "db_password"
	DB_NAME     = "db_name"
	DB_SSLMODE  = "db_sslmode"
	DB_SCHEMA   = "db_schema"

	// Encryption key (Base64 encoded, 32 bytes for AES-256)
	AES_SECRET_KEY = "aes_secret_key"
)

// CONFIG STRUCTS
type DatabaseConfig struct {
	Host     string
	Port     string
	UserName string
	Password string
	Name     string
	SSLMode  string
	Schema   string
}

type IntermediaryWallet struct {
	ID                  int64
	WalletAddress       string
	EncryptedPrivateKey string
	Type                string
	Status              string
	CreatedAt           time.Time
}

type CleanupStats struct {
	TotalWallets        int
	CorruptedWallets    int
	ValidWallets        int
	DeletedWallets      int
	DeletedRedEnvelopes int
	DeletedClaims       int
	DeletedSplitMoney   int
	DeletedOffers       int
	DeletedOrders       int
	SoftDeletedWallets  int
	SoftDeletedRedEnv   int
	SoftDeletedOffers   int
}

func main() {
	dryRun := flag.Bool("dry-run", false, "Preview what would be deleted without actually deleting")
	force := flag.Bool("force", false, "Force delete all corrupted wallets and related records (cascade delete)")
	flag.Parse()

	// Load encryption key from constant
	encryptionKey, err := loadEncryptionKey()
	if err != nil {
		fmt.Printf("[ERROR] Error loading encryption key: %v\n", err)
		return
	}

	// Build config from constants
	cfg := &DatabaseConfig{
		Host:     DB_HOST,
		Port:     DB_PORT,
		UserName: DB_USERNAME,
		Password: DB_PASSWORD,
		Name:     DB_NAME,
		SSLMode:  DB_SSLMODE,
		Schema:   DB_SCHEMA,
	}

	// Connect to database
	db, err := connectDB(cfg)
	if err != nil {
		fmt.Printf("[ERROR] Error connecting to database: %v\n", err)
		return
	}
	defer db.Close()

	// Run cleanup
	stats, err := runCleanup(db, cfg.Schema, encryptionKey, *dryRun, *force)
	if err != nil {
		fmt.Printf("[ERROR] Error during cleanup: %v\n", err)
		return
	}

	// Print summary
	printSummary(stats, *dryRun, *force)
}

func loadEncryptionKey() ([]byte, error) {
	if AES_SECRET_KEY == "" {
		return nil, errors.New("AES_SECRET_KEY constant is empty")
	}

	key, err := base64.StdEncoding.DecodeString(AES_SECRET_KEY)
	if err != nil {
		return nil, errors.New("invalid encryption key format")
	}

	if len(key) != 32 {
		return nil, errors.New("encryption key must be 32 bytes for AES-256")
	}

	return key, nil
}

func connectDB(cfg *DatabaseConfig) (*sql.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s search_path=%s",
		cfg.Host, cfg.Port, cfg.UserName, cfg.Password, cfg.Name, cfg.SSLMode, cfg.Schema)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil

}

// DECRYPTION
func tryDecrypt(encryptedPrivateKey string, encryptionKey []byte) error {
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedPrivateKey)
	if err != nil {
		return err
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	_, err = gcm.Open(nil, nonce, ciphertext, nil)
	return err
}

// CLEANUP LOGIC
func runCleanup(db *sql.DB, schema string, encryptionKey []byte, dryRun bool, force bool) (*CleanupStats, error) {
	stats := &CleanupStats{}

	// Get all wallets
	wallets, err := getAllWallets(db, schema)
	if err != nil {
		return nil, fmt.Errorf("failed to get wallets: %w", err)
	}
	stats.TotalWallets = len(wallets)

	// Check each wallet and categorize
	var corruptedWallets []IntermediaryWallet
	for _, w := range wallets {
		err := tryDecrypt(w.EncryptedPrivateKey, encryptionKey)
		if err != nil {
			corruptedWallets = append(corruptedWallets, w)
		} else {
			stats.ValidWallets++
		}
	}
	stats.CorruptedWallets = len(corruptedWallets)

	if len(corruptedWallets) == 0 {
		return stats, nil
	}

	// Separate by type for batch processing
	var luckyMoneyWallets, offerWallets []IntermediaryWallet
	var readyWallets, inUseWallets []IntermediaryWallet

	for _, w := range corruptedWallets {
		switch w.Type {
		case "LUCKY_MONEY":
			luckyMoneyWallets = append(luckyMoneyWallets, w)
		case "OFFER":
			offerWallets = append(offerWallets, w)
		}

		switch w.Status {
		case "READY":
			readyWallets = append(readyWallets, w)
		default:
			inUseWallets = append(inUseWallets, w)
		}
	}

	switch {
	case dryRun:
		err = batchPreviewDeletion(db, schema, luckyMoneyWallets, offerWallets, stats)
	case force:
		err = batchCascadeDelete(db, schema, luckyMoneyWallets, offerWallets, corruptedWallets, stats)
	default:
		err = batchSmartDelete(db, schema, readyWallets, inUseWallets, stats)
	}

	if err != nil {
		return nil, err
	}

	return stats, nil
}

func getAllWallets(db *sql.DB, schema string) ([]IntermediaryWallet, error) {
	query := fmt.Sprintf(`
		SELECT id, wallet_address, encrypted_private_key, type, status, created_at
		FROM %s.intermediary_wallet
		ORDER BY id
	`, schema)

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wallets []IntermediaryWallet
	for rows.Next() {
		var w IntermediaryWallet
		err := rows.Scan(&w.ID, &w.WalletAddress, &w.EncryptedPrivateKey, &w.Type, &w.Status, &w.CreatedAt)
		if err != nil {
			return nil, err
		}
		wallets = append(wallets, w)
	}

	return wallets, nil
}

// BATCH PREVIEW
func batchPreviewDeletion(db *sql.DB, schema string, luckyMoneyWallets, offerWallets []IntermediaryWallet, stats *CleanupStats) error {
	// Count red envelope records in batch
	if len(luckyMoneyWallets) > 0 {
		addresses := extractAddresses(luckyMoneyWallets)
		redEnvCount, claimCount, splitCount, err := countRedEnvelopeRecordsBatch(db, schema, addresses)
		if err != nil {
			return err
		}
		stats.DeletedRedEnvelopes = redEnvCount
		stats.DeletedClaims = claimCount
		stats.DeletedSplitMoney = splitCount
	}

	// Count offer records in batch
	if len(offerWallets) > 0 {
		addresses := extractAddresses(offerWallets)
		offerCount, orderCount, err := countOfferRecordsBatch(db, schema, addresses)
		if err != nil {
			return err
		}
		stats.DeletedOffers = offerCount
		stats.DeletedOrders = orderCount
	}

	return nil
}

func countRedEnvelopeRecordsBatch(db *sql.DB, schema string, addresses []string) (redEnv, claims, splits int, err error) {
	// Count red envelopes
	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.red_envelope 
		WHERE red_envelope_wallet = ANY($1)
	`, schema), pq.Array(addresses)).Scan(&redEnv)
	if err != nil {
		return
	}

	// Count claims
	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.red_envelope_claim 
		WHERE red_envelope_id IN (
			SELECT id FROM %s.red_envelope WHERE red_envelope_wallet = ANY($1)
		)
	`, schema, schema), pq.Array(addresses)).Scan(&claims)
	if err != nil {
		return
	}

	// Count splits
	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.red_envelope_split_money 
		WHERE red_envelope_id IN (
			SELECT id FROM %s.red_envelope WHERE red_envelope_wallet = ANY($1)
		)
	`, schema, schema), pq.Array(addresses)).Scan(&splits)

	return
}

func countOfferRecordsBatch(db *sql.DB, schema string, addresses []string) (offers, orders int, err error) {
	// Count offers
	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.p2p_offers 
		WHERE intermediary_wallet_address = ANY($1)
	`, schema), pq.Array(addresses)).Scan(&offers)
	if err != nil {
		return
	}

	// Count orders
	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.p2p_orders 
		WHERE offer_id IN (
			SELECT offer_id FROM %s.p2p_offers WHERE intermediary_wallet_address = ANY($1)
		)
	`, schema, schema), pq.Array(addresses)).Scan(&orders)

	return
}

// BATCH CASCADE DELETE (FORCE)
func batchCascadeDelete(db *sql.DB, schema string, luckyMoneyWallets, offerWallets, allWallets []IntermediaryWallet, stats *CleanupStats) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Delete red envelope related records
	if len(luckyMoneyWallets) > 0 {
		addresses := extractAddresses(luckyMoneyWallets)
		claims, splits, redEnvs, err := batchDeleteRedEnvelopeRecords(tx, schema, addresses)
		if err != nil {
			return err
		}
		stats.DeletedClaims = claims
		stats.DeletedSplitMoney = splits
		stats.DeletedRedEnvelopes = redEnvs
	}

	// Delete offer related records
	if len(offerWallets) > 0 {
		addresses := extractAddresses(offerWallets)
		orders, offers, err := batchDeleteOfferRecords(tx, schema, addresses)
		if err != nil {
			return err
		}
		stats.DeletedOrders = orders
		stats.DeletedOffers = offers
	}

	// Delete all corrupted wallets
	if len(allWallets) > 0 {
		ids := extractIDs(allWallets)
		result, err := tx.Exec(fmt.Sprintf(`
			DELETE FROM %s.intermediary_wallet WHERE id = ANY($1)
		`, schema), pq.Array(ids))
		if err != nil {
			return err
		}
		affected, _ := result.RowsAffected()
		stats.DeletedWallets = int(affected)
	}

	return tx.Commit()
}

func batchDeleteRedEnvelopeRecords(tx *sql.Tx, schema string, addresses []string) (claims, splits, redEnvs int, err error) {
	// Get all red envelope IDs first
	rows, err := tx.Query(fmt.Sprintf(`
		SELECT id FROM %s.red_envelope WHERE red_envelope_wallet = ANY($1)
	`, schema), pq.Array(addresses))
	if err != nil {
		return
	}
	defer rows.Close()

	var redEnvelopeIDs []string
	for rows.Next() {
		var id string
		if err = rows.Scan(&id); err != nil {
			return
		}
		redEnvelopeIDs = append(redEnvelopeIDs, id)
	}

	if len(redEnvelopeIDs) == 0 {
		return 0, 0, 0, nil
	}

	// Delete claims in batch
	result, err := tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.red_envelope_claim WHERE red_envelope_id = ANY($1)
	`, schema), pq.Array(redEnvelopeIDs))
	if err != nil {
		return
	}
	affected, _ := result.RowsAffected()
	claims = int(affected)

	// Delete splits in batch
	result, err = tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.red_envelope_split_money WHERE red_envelope_id = ANY($1)
	`, schema), pq.Array(redEnvelopeIDs))
	if err != nil {
		return
	}
	affected, _ = result.RowsAffected()
	splits = int(affected)

	// Delete red envelopes in batch
	result, err = tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.red_envelope WHERE id = ANY($1)
	`, schema), pq.Array(redEnvelopeIDs))
	if err != nil {
		return
	}
	affected, _ = result.RowsAffected()
	redEnvs = int(affected)

	return
}

func batchDeleteOfferRecords(tx *sql.Tx, schema string, addresses []string) (orders, offers int, err error) {
	// Get all offer IDs first
	rows, err := tx.Query(fmt.Sprintf(`
		SELECT offer_id FROM %s.p2p_offers WHERE intermediary_wallet_address = ANY($1)
	`, schema), pq.Array(addresses))
	if err != nil {
		return
	}
	defer rows.Close()

	var offerIDs []int64
	for rows.Next() {
		var id int64
		if err = rows.Scan(&id); err != nil {
			return
		}
		offerIDs = append(offerIDs, id)
	}

	if len(offerIDs) == 0 {
		return 0, 0, nil
	}

	// Delete orders in batch
	result, err := tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.p2p_orders WHERE offer_id = ANY($1)
	`, schema), pq.Array(offerIDs))
	if err != nil {
		return
	}
	affected, _ := result.RowsAffected()
	orders = int(affected)

	// Delete offers in batch
	result, err = tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.p2p_offers WHERE offer_id = ANY($1)
	`, schema), pq.Array(offerIDs))
	if err != nil {
		return
	}
	affected, _ = result.RowsAffected()
	offers = int(affected)

	return
}

// BATCH SMART DELETE
func batchSmartDelete(db *sql.DB, schema string, readyWallets, inUseWallets []IntermediaryWallet, stats *CleanupStats) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Hard delete READY wallets (they have no related records)
	if len(readyWallets) > 0 {
		ids := extractIDs(readyWallets)
		result, err := tx.Exec(fmt.Sprintf(`
			DELETE FROM %s.intermediary_wallet WHERE id = ANY($1)
		`, schema), pq.Array(ids))
		if err != nil {
			return err
		}
		affected, _ := result.RowsAffected()
		stats.DeletedWallets = int(affected)
	}

	// Soft delete IN_USE wallets
	if len(inUseWallets) > 0 {
		// Separate in-use wallets by type
		var inUseLuckyMoney, inUseOffer []IntermediaryWallet
		for _, w := range inUseWallets {
			switch w.Type {
			case "LUCKY_MONEY":
				inUseLuckyMoney = append(inUseLuckyMoney, w)
			case "OFFER":
				inUseOffer = append(inUseOffer, w)
			}
		}

		// Mark red envelopes as FAILED
		if len(inUseLuckyMoney) > 0 {
			addresses := extractAddresses(inUseLuckyMoney)
			result, err := tx.Exec(fmt.Sprintf(`
				UPDATE %s.red_envelope SET status = 'FAILED', updated_at = NOW() 
				WHERE red_envelope_wallet = ANY($1) AND status NOT IN ('FAILED', 'EXPIRED')
			`, schema), pq.Array(addresses))
			if err != nil {
				return err
			}
			affected, _ := result.RowsAffected()
			stats.SoftDeletedRedEnv = int(affected)
		}

		// Mark offers as CANCELED
		if len(inUseOffer) > 0 {
			addresses := extractAddresses(inUseOffer)
			result, err := tx.Exec(fmt.Sprintf(`
				UPDATE %s.p2p_offers SET status = 'CANCELED', updated_at = NOW() 
				WHERE intermediary_wallet_address = ANY($1) AND status NOT IN ('CANCELED', 'FAILED', 'COMPLETED')
			`, schema), pq.Array(addresses))
			if err != nil {
				return err
			}
			affected, _ := result.RowsAffected()
			stats.SoftDeletedOffers = int(affected)
		}

		// Disable all in-use wallets
		ids := extractIDs(inUseWallets)
		result, err := tx.Exec(fmt.Sprintf(`
			UPDATE %s.intermediary_wallet SET status = 'DISABLED', updated_at = NOW() 
			WHERE id = ANY($1)
		`, schema), pq.Array(ids))
		if err != nil {
			return err
		}
		affected, _ := result.RowsAffected()
		stats.SoftDeletedWallets = int(affected)
	}

	return tx.Commit()
}

// HELPERS
func extractAddresses(wallets []IntermediaryWallet) []string {
	addresses := make([]string, len(wallets))
	for i, w := range wallets {
		addresses[i] = w.WalletAddress
	}
	return addresses
}

func extractIDs(wallets []IntermediaryWallet) []int64 {
	ids := make([]int64, len(wallets))
	for i, w := range wallets {
		ids[i] = w.ID
	}
	return ids
}

// SUMMARY
func printSummary(stats *CleanupStats, dryRun bool, force bool) {
	fmt.Println("==========================================================")
	fmt.Println("   INTERMEDIARY WALLET CLEANUP - SUMMARY")
	fmt.Println("==========================================================")
	fmt.Printf("Total wallets scanned:     %d\n", stats.TotalWallets)
	fmt.Printf("Valid wallets:             %d\n", stats.ValidWallets)
	fmt.Printf("Corrupted wallets:         %d\n", stats.CorruptedWallets)
	fmt.Println()

	if stats.CorruptedWallets == 0 {
		fmt.Println("All wallets are valid. No cleanup needed.")
		fmt.Println("==========================================================")
		return
	}

	switch {
	case dryRun:
		fmt.Println("Mode: DRY-RUN (no changes made)")
		fmt.Println("Records that WOULD be affected:")
		if stats.DeletedRedEnvelopes > 0 {
			fmt.Printf("   - red_envelope:            %d\n", stats.DeletedRedEnvelopes)
			fmt.Printf("   - red_envelope_claim:      %d\n", stats.DeletedClaims)
			fmt.Printf("   - red_envelope_split_money: %d\n", stats.DeletedSplitMoney)
		}
		if stats.DeletedOffers > 0 {
			fmt.Printf("   - offers:                  %d\n", stats.DeletedOffers)
			fmt.Printf("   - orders:                  %d\n", stats.DeletedOrders)
		}

	case force:
		fmt.Println("Mode: FORCE DELETE")
		fmt.Println("Records deleted:")
		fmt.Printf("   - intermediary_wallet:     %d\n", stats.DeletedWallets)
		if stats.DeletedRedEnvelopes > 0 {
			fmt.Printf("   - red_envelope:            %d\n", stats.DeletedRedEnvelopes)
			fmt.Printf("   - red_envelope_claim:      %d\n", stats.DeletedClaims)
			fmt.Printf("   - red_envelope_split_money: %d\n", stats.DeletedSplitMoney)
		}
		if stats.DeletedOffers > 0 {
			fmt.Printf("   - offers:                  %d\n", stats.DeletedOffers)
			fmt.Printf("   - orders:                  %d\n", stats.DeletedOrders)
		}

	default:
		fmt.Println("Mode: SMART DELETE")
		fmt.Println("Actions taken:")
		if stats.DeletedWallets > 0 {
			fmt.Printf("   - intermediary_wallet deleted(READY):  %d\n", stats.DeletedWallets)
		}
		if stats.SoftDeletedWallets > 0 {
			fmt.Printf("   - intermediary_wallet disabled(IN-USE): %d\n", stats.SoftDeletedWallets)
		}
		if stats.SoftDeletedRedEnv > 0 {
			fmt.Printf("   - red_envelope marked FAILED:   %d\n", stats.SoftDeletedRedEnv)
		}
		if stats.SoftDeletedOffers > 0 {
			fmt.Printf("   - offers marked CANCELED:       %d\n", stats.SoftDeletedOffers)
		}
	}
	fmt.Println("==========================================================")

	if dryRun && stats.CorruptedWallets > 0 {
		fmt.Println("To actually delete, run:")
		fmt.Println("   go run scripts/cleanup/main.go                # Smart delete")
		fmt.Println("   go run scripts/cleanup/main.go --force        # Force cascade delete")
	}
}
