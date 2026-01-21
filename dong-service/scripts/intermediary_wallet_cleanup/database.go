package main

import (
	"database/sql"
	"fmt"

	"github.com/lib/pq"
)

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

func countRedEnvelopeRecordsBatch(db *sql.DB, schema string, addresses []string) (redEnv, claims, splits int, err error) {
	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.red_envelope 
		WHERE red_envelope_wallet = ANY($1)
	`, schema), pq.Array(addresses)).Scan(&redEnv)
	if err != nil {
		return
	}

	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.red_envelope_claim 
		WHERE red_envelope_id IN (
			SELECT id FROM %s.red_envelope WHERE red_envelope_wallet = ANY($1)
		)
	`, schema, schema), pq.Array(addresses)).Scan(&claims)
	if err != nil {
		return
	}

	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.red_envelope_split_money 
		WHERE red_envelope_id IN (
			SELECT id FROM %s.red_envelope WHERE red_envelope_wallet = ANY($1)
		)
	`, schema, schema), pq.Array(addresses)).Scan(&splits)

	return
}

func countOfferRecordsBatch(db *sql.DB, schema string, addresses []string) (offers, orders int, err error) {
	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.p2p_offers 
		WHERE intermediary_wallet_address = ANY($1)
	`, schema), pq.Array(addresses)).Scan(&offers)
	if err != nil {
		return
	}

	err = db.QueryRow(fmt.Sprintf(`
		SELECT COUNT(*) FROM %s.p2p_orders 
		WHERE offer_id IN (
			SELECT offer_id FROM %s.p2p_offers WHERE intermediary_wallet_address = ANY($1)
		)
	`, schema, schema), pq.Array(addresses)).Scan(&orders)

	return
}

func batchDeleteRedEnvelopeRecords(tx *sql.Tx, schema string, addresses []string) (claims, splits, redEnvs int, err error) {
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

	result, err := tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.red_envelope_claim WHERE red_envelope_id = ANY($1)
	`, schema), pq.Array(redEnvelopeIDs))
	if err != nil {
		return
	}
	affected, _ := result.RowsAffected()
	claims = int(affected)

	result, err = tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.red_envelope_split_money WHERE red_envelope_id = ANY($1)
	`, schema), pq.Array(redEnvelopeIDs))
	if err != nil {
		return
	}
	affected, _ = result.RowsAffected()
	splits = int(affected)

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

	result, err := tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.p2p_orders WHERE offer_id = ANY($1)
	`, schema), pq.Array(offerIDs))
	if err != nil {
		return
	}
	affected, _ := result.RowsAffected()
	orders = int(affected)

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

func deleteIntermediaryWallets(tx *sql.Tx, schema string, ids []int64) (int, error) {
	result, err := tx.Exec(fmt.Sprintf(`
		DELETE FROM %s.intermediary_wallet WHERE id = ANY($1)
	`, schema), pq.Array(ids))
	if err != nil {
		return 0, err
	}
	affected, _ := result.RowsAffected()
	return int(affected), nil
}

func disableIntermediaryWallets(tx *sql.Tx, schema string, ids []int64) (int, error) {
	result, err := tx.Exec(fmt.Sprintf(`
		UPDATE %s.intermediary_wallet SET status = 'DISABLED', updated_at = NOW() 
		WHERE id = ANY($1)
	`, schema), pq.Array(ids))
	if err != nil {
		return 0, err
	}
	affected, _ := result.RowsAffected()
	return int(affected), nil
}

func markRedEnvelopesFailed(tx *sql.Tx, schema string, addresses []string) (int, error) {
	result, err := tx.Exec(fmt.Sprintf(`
		UPDATE %s.red_envelope SET status = 'FAILED', updated_at = NOW() 
		WHERE red_envelope_wallet = ANY($1) AND status NOT IN ('FAILED', 'EXPIRED')
	`, schema), pq.Array(addresses))
	if err != nil {
		return 0, err
	}
	affected, _ := result.RowsAffected()
	return int(affected), nil
}

func markOffersCanceled(tx *sql.Tx, schema string, addresses []string) (int, error) {
	result, err := tx.Exec(fmt.Sprintf(`
		UPDATE %s.p2p_offers SET status = 'CANCELED', updated_at = NOW() 
		WHERE intermediary_wallet_address = ANY($1) AND status NOT IN ('CANCELED', 'FAILED', 'COMPLETED')
	`, schema), pq.Array(addresses))
	if err != nil {
		return 0, err
	}
	affected, _ := result.RowsAffected()
	return int(affected), nil
}
