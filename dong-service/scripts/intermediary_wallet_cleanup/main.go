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

// WALLET TYPES
const (
	WalletTypeDefault    = "DEFAULT"
	WalletTypeLuckyMoney = "LUCKY_MONEY"
	WalletTypeOffer      = "OFFER"
)

// WALLET STATUSES
const (
	WalletStatusReady          = "READY"
	WalletStatusInUse          = "IN_USE"
	WalletStatusPrepareReplace = "PREPARE_REPLACE"
	WalletStatusDisabled       = "DISABLED"
)

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

func runCleanup(db *sql.DB, schema string, encryptionKey []byte, dryRun bool, force bool) (*CleanupStats, error) {
	stats := &CleanupStats{}

	wallets, err := getAllWallets(db, schema)
	if err != nil {
		return nil, fmt.Errorf("failed to get wallets: %w", err)
	}
	stats.TotalWallets = len(wallets)

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
		case WalletTypeLuckyMoney:
			luckyMoneyWallets = append(luckyMoneyWallets, w)
		case WalletTypeOffer:
			offerWallets = append(offerWallets, w)
		}

		switch w.Status {
		case WalletStatusReady:
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
		affected, err := deleteIntermediaryWallets(tx, schema, ids)
		if err != nil {
			return err
		}
		stats.DeletedWallets = affected
	}

	return tx.Commit()
}

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
		affected, err := deleteIntermediaryWallets(tx, schema, ids)
		if err != nil {
			return err
		}
		stats.DeletedWallets = affected
	}

	// Soft delete IN_USE wallets
	if len(inUseWallets) > 0 {
		var inUseLuckyMoney, inUseOffer []IntermediaryWallet
		for _, w := range inUseWallets {
			switch w.Type {
			case WalletTypeLuckyMoney:
				inUseLuckyMoney = append(inUseLuckyMoney, w)
			case WalletTypeOffer:
				inUseOffer = append(inUseOffer, w)
			}
		}

		if len(inUseLuckyMoney) > 0 {
			addresses := extractAddresses(inUseLuckyMoney)
			affected, err := markRedEnvelopesFailed(tx, schema, addresses)
			if err != nil {
				return err
			}
			stats.SoftDeletedRedEnv = affected
		}

		if len(inUseOffer) > 0 {
			addresses := extractAddresses(inUseOffer)
			affected, err := markOffersCanceled(tx, schema, addresses)
			if err != nil {
				return err
			}
			stats.SoftDeletedOffers = affected
		}

		ids := extractIDs(inUseWallets)
		affected, err := disableIntermediaryWallets(tx, schema, ids)
		if err != nil {
			return err
		}
		stats.SoftDeletedWallets = affected
	}

	return tx.Commit()
}

// Helper functions
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
