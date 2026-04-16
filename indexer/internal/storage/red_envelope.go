package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/big"
	"sort"

	"github.com/lib/pq"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/integration/dong"
	"github.com/rs/zerolog/log"
)

const (
	// Red Envelope Statuses for Dong Service API
	RedEnvelopeStatusPublished = 2
	RedEnvelopeStatusFailed    = 3

	// Red Envelope validation actions
	RedEnvelopeActionUpdatePublished = "Red Envelope Update Published"
	RedEnvelopeActionUpdateFailed    = "Red Envelope Update Failed"
)

type validatedRedEnvelope struct {
	ID   string
	Hash string
}

type redEnvelopeRow struct {
	ID                string
	OwnerWallet       string
	RedEnvelopeWallet string
	Amount            string
	Status            string
}

func (p *PostgresConnector) updateRedEnvelopeClaimStatus(ctx context.Context, tx *sql.Tx, txs []common.Transaction) error {
	if len(txs) == 0 {
		return nil
	}

	log.Info().Int("claims_to_reconcile", len(txs)).Msg("starting precise red envelope claim reconciliation")

	type Extra struct {
		ClaimID int64 `json:"claim_id"`
	}

	claimTxMap := make(map[int64]common.Transaction)
	claimIDs := make([]int64, 0, len(txs))

	for _, t := range txs {
		var extra Extra
		if err := json.Unmarshal([]byte(t.ExtraInfo), &extra); err != nil || extra.ClaimID == 0 {
			log.Warn().Str("tx_hash", t.Hash).Msg("claim_id missing in extra_info, skipping precise reconciliation")
			continue
		}
		claimTxMap[extra.ClaimID] = t
		claimIDs = append(claimIDs, extra.ClaimID)
	}

	if len(claimIDs) == 0 {
		return nil
	}

	// Fetch expected claim details for validation
	querySelect := `
		SELECT 
			rec.id, 
			rec.claimer_wallet, 
			rec.amount, 
			re.red_envelope_wallet
		FROM dong_schema.red_envelope_claim rec
		JOIN dong_schema.red_envelope re ON rec.red_envelope_id = re.id
		WHERE rec.id = ANY($1::bigint[])
			AND rec.status = 'PENDING'
		FOR UPDATE OF rec
	`

	rows, err := tx.QueryContext(ctx, querySelect, pq.Array(claimIDs))
	if err != nil {
		return fmt.Errorf("failed to select red envelope claims for validation: %w", err)
	}
	defer rows.Close()

	type claimRow struct {
		ID                 int64
		ClaimerWallet      string
		Amount             int64
		IntermediaryWallet string
	}

	claimMap := make(map[int64]claimRow)
	for rows.Next() {
		var c claimRow
		if err := rows.Scan(&c.ID, &c.ClaimerWallet, &c.Amount, &c.IntermediaryWallet); err != nil {
			log.Error().Err(err).Msg("failed to scan red envelope claim row")
			return err
		}
		claimMap[c.ID] = c
	}

	type validClaim struct {
		ID   int64
		Hash string
	}
	validClaims := make([]validClaim, 0)

	for id, t := range claimTxMap {
		c, ok := claimMap[id]
		if !ok {
			log.Error().Int64("claim_id", id).Str("tx_hash", t.Hash).
				Msg("claim validation failed: claim not found or not PENDING")
			continue
		}

		// Check that the transaction is from the correct intermediary wallet
		if t.FromAddress != c.IntermediaryWallet {
			log.Error().Int64("claim_id", id).Str("tx_hash", t.Hash).
				Str("expected_wallet", c.IntermediaryWallet).Str("actual_wallet", t.FromAddress).
				Msg("claim validation failed: intermediary wallet mismatch")
			continue
		}

		// Check that the transaction is to the correct claimer wallet
		if t.ToAddress != c.ClaimerWallet {
			log.Error().Int64("claim_id", id).Str("tx_hash", t.Hash).
				Str("expected_wallet", c.ClaimerWallet).Str("actual_wallet", t.ToAddress).
				Msg("claim validation failed: claimer wallet mismatch")
			continue
		}

		// Check that the transaction amount matches the claim amount
		txValueBig := new(big.Int)
		if _, ok := txValueBig.SetString(t.Value, 10); !ok {
			log.Error().Int64("claim_id", id).Str("tx_hash", t.Hash).
				Str("bad_value", t.Value).
				Msg("claim validation failed: could not parse tx value as big.Int")
			continue
		}

		if txValueBig.Int64() != c.Amount {
			log.Error().Int64("claim_id", id).Str("tx_hash", t.Hash).
				Int64("expected_amount", c.Amount).Int64("actual_amount", txValueBig.Int64()).
				Msg("claim validation failed: amount mismatch")
			continue
		}

		validClaims = append(validClaims, validClaim{ID: id, Hash: t.Hash})
	}

	if len(validClaims) == 0 {
		log.Info().Msg("no valid claims to update")
		return nil
	}

	// Sort by ID to prevent database deadlocks on concurrent updates
	sort.Slice(validClaims, func(i, j int) bool {
		return validClaims[i].ID < validClaims[j].ID
	})

	finalClaimIDs := make([]int64, len(validClaims))
	finalTxHashes := make([]string, len(validClaims))
	for i, c := range validClaims {
		finalClaimIDs[i] = c.ID
		finalTxHashes[i] = c.Hash
	}

	queryUpdate := `
		UPDATE dong_schema.red_envelope_claim rec
		SET status = 'SUCCESS', transaction_hash = v.tx_hash
		FROM unnest($1::bigint[], $2::text[]) AS v(id, tx_hash)
		WHERE rec.id = v.id AND rec.status = 'PENDING'
		RETURNING rec.id
	`
	rowsUpdate, err := tx.QueryContext(ctx, queryUpdate, pq.Array(finalClaimIDs), pq.Array(finalTxHashes))
	if err != nil {
		log.Error().Err(err).Msg("Failed to batch reconcile red envelope claims")
		return err
	}
	defer rowsUpdate.Close()

	reconciledCount := 0
	for rowsUpdate.Next() {
		reconciledCount++
	}

	if err := rowsUpdate.Err(); err != nil {
		log.Error().Err(err).Msg("Error occurred while reading reconciled rows")
		return err
	}

	log.Info().Int("claims_reconciled", reconciledCount).Msg("Successfully reconciled red envelope claims via precise batch update")

	return nil
}

func (p *PostgresConnector) updateRedEnvelopeStatus(
	ctx context.Context,
	tx *sql.Tx,
	txs []common.Transaction,
) error {
	log.Debug().Int("tx_count", len(txs)).Msg("Starting updateRedEnvelopeStatus")

	validatedTxs, err := p.validateRedEnvelopeTransactions(ctx, tx, txs, RedEnvelopeActionUpdatePublished)
	if err != nil {
		log.Error().Err(err).Msg("validateRedEnvelopeTransactions failed in updateRedEnvelopeStatus")
		return err
	}

	if len(validatedTxs) == 0 {
		log.Debug().Msg("No valid transactions found for red envelope update published status in updateRedEnvelopeStatus")
		return nil
	}

	updates := make([]dong.DongUpdateEntry, 0, len(validatedTxs))
	for _, v := range validatedTxs {
		log.Debug().Str("red_envelope_id", v.ID).Str("tx_hash", v.Hash).Msg("Preparing to update red envelope status to published")
		updates = append(updates, dong.DongUpdateEntry{
			ID:              v.ID,
			Status:          RedEnvelopeStatusPublished,
			TransactionHash: v.Hash,
		})
	}

	if err := p.dongClient.UpdateRedEnvelopeStatus(ctx, updates); err != nil {
		log.Error().Err(err).Msg("failed to call dong service for red envelope status update")
		return fmt.Errorf("failed to call dong service for red envelope status update: %w", err)
	}

	log.Info().Int("red_envelopes_updated", len(validatedTxs)).Msg("red envelope status update completed via dong service")

	return nil
}

func (p *PostgresConnector) failRedEnvelopeStatus(
	ctx context.Context,
	tx *sql.Tx,
	txs []common.Transaction,
) error {
	validated, err := p.validateRedEnvelopeTransactions(ctx, tx, txs, RedEnvelopeActionUpdateFailed)
	if err != nil {
		return err
	}

	if len(validated) == 0 {
		return nil
	}

	updates := make([]dong.DongUpdateEntry, 0, len(validated))
	for _, v := range validated {
		updates = append(updates, dong.DongUpdateEntry{
			ID:     v.ID,
			Status: RedEnvelopeStatusFailed,
		})
	}

	if err := p.dongClient.UpdateRedEnvelopeStatus(ctx, updates); err != nil {
		return fmt.Errorf("failed to call dong service for red envelope failure update: %w", err)
	}

	log.Info().Int("red_envelopes_failed", len(validated)).Msg("failed red envelopes updated via dong service")

	return nil
}

func (p *PostgresConnector) validateRedEnvelopeTransactions(
	ctx context.Context,
	tx *sql.Tx,
	txs []common.Transaction,
	logAction string,
) ([]validatedRedEnvelope, error) {
	log.Info().Int("transactions_to_validate", len(txs)).Str("action", logAction).Msg("starting red envelope validation")
	if len(txs) == 0 {
		log.Debug().Str("action", logAction).Msg("Red envelope transaction list is empty, nothing to validate")
		return nil, nil
	}

	type Extra struct {
		RedEnvelopeID string `json:"red_envelope_id"`
	}

	redEnvelopeIDs := make([]string, 0, len(txs))
	txMap := make(map[string]common.Transaction)
	redEnvelopeIDMap := make(map[string]string)

	for _, t := range txs {
		var extra Extra
		if err := json.Unmarshal([]byte(t.ExtraInfo), &extra); err != nil || extra.RedEnvelopeID == "" {
			log.Debug().Str("tx_hash", t.Hash).Str("action", logAction).Msg("Transaction has no valid ExtraInfo or RedEnvelopeID, skipping validation")
			continue
		}
		log.Debug().Str("tx_hash", t.Hash).Str("red_envelope_id", extra.RedEnvelopeID).Str("action", logAction).Msg("Transaction identified for red envelope validation")
		redEnvelopeIDs = append(redEnvelopeIDs, extra.RedEnvelopeID)
		txMap[t.Hash] = t
		redEnvelopeIDMap[t.Hash] = extra.RedEnvelopeID
	}

	if len(redEnvelopeIDs) == 0 {
		log.Info().Str("action", logAction).Msg("no potential red envelopes to validate after processing ExtraInfo")
		return nil, nil
	}

	querySelect := `
    SELECT
        id,
        owner_wallet,
        red_envelope_wallet,
        total_amount,
        status
    FROM dong_schema.red_envelope
    WHERE id = ANY($1::uuid[])
      AND status = 'PENDING'
    FOR UPDATE
    `

	rows, err := tx.QueryContext(ctx, querySelect, pq.Array(redEnvelopeIDs))
	if err != nil {
		log.Error().Err(err).Str("action", logAction).Msg("QueryContext for red envelope validation failed")
		return nil, fmt.Errorf("select red envelopes for validation (%s) failed: %w", logAction, err)
	}
	defer rows.Close()

	envelopeMap := make(map[string]redEnvelopeRow)
	for rows.Next() {
		var e redEnvelopeRow
		if err := rows.Scan(
			&e.ID,
			&e.OwnerWallet,
			&e.RedEnvelopeWallet,
			&e.Amount,
			&e.Status,
		); err != nil {
			log.Error().Err(err).Str("action", logAction).Msg("failed to scan red envelope row")
			return nil, err
		}
		envelopeMap[e.ID] = e
	}

	validated := make([]validatedRedEnvelope, 0)

	for hash, t := range txMap {
		redEnvelopeID := redEnvelopeIDMap[hash]
		log.Debug().Str("action", logAction).Str("tx_hash", hash).Str("red_envelope_id", redEnvelopeID).Msg("Validating red envelope details against transaction")

		e, ok := envelopeMap[redEnvelopeID]
		if !ok {
			log.Error().
				Str("action", logAction).
				Str("red_envelope_id", redEnvelopeID).
				Str("tx_hash", t.Hash).
				Msg("red envelope validation failed: red envelope not found or not PENDING")
			continue
		}

		if e.OwnerWallet != t.FromAddress {
			log.Error().
				Str("action", logAction).
				Str("red_envelope_id", redEnvelopeID).
				Str("tx_hash", t.Hash).
				Str("expected", e.OwnerWallet).
				Str("got", t.FromAddress).
				Msg("red envelope validation failed: owner wallet mismatch")
			continue
		}

		if e.RedEnvelopeWallet != t.ToAddress {
			log.Error().
				Str("action", logAction).
				Str("red_envelope_id", redEnvelopeID).
				Str("tx_hash", t.Hash).
				Str("expected", e.RedEnvelopeWallet).
				Str("got", t.ToAddress).
				Msg("red envelope validation failed: red envelope wallet mismatch")
			continue
		}

		transactionValueBig := new(big.Int)
		envelopeValueBig := new(big.Int)
		transactionValueBig.SetString(t.Value, 10)
		envelopeValueBig.SetString(e.Amount, 10)
		envelopeValueBig.Mul(envelopeValueBig, big.NewInt(P2PMultiplier))
		if transactionValueBig.Cmp(envelopeValueBig) != 0 {
			log.Error().
				Str("action", logAction).
				Str("red_envelope_id", redEnvelopeID).
				Str("tx_hash", t.Hash).
				Str("expected", envelopeValueBig.String()).
				Str("got", transactionValueBig.String()).
				Msg("red envelope validation failed: amount mismatch")
			continue
		}

		validated = append(validated, validatedRedEnvelope{ID: redEnvelopeID, Hash: t.Hash})
		log.Debug().Str("action", logAction).Str("tx_hash", t.Hash).Str("red_envelope_id", redEnvelopeID).Msg("Transaction successfully validated for red envelope")
	}

	if len(validated) == 0 {
		log.Debug().Str("action", logAction).Msg("No transactions passed red envelope validation")
	}

	return validated, nil
}
