package repository

import (
	"context"
	"database/sql"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/utils"
	"fmt"
	"strings"
	"time"
)

type RedEnvelopeRepository struct {
	db                *sql.DB
	dongSchema        string
	blockchainService *blockchain.BlockchainService
	walletRepo        *RedEnvelopeWalletRepository
	queueService      *RedEnvelopeQueueService
}

func NewRedEnvelopeRepository(db *sql.DB, dongSchema string, blockchainService *blockchain.BlockchainService, walletRepo *RedEnvelopeWalletRepository) *RedEnvelopeRepository {
	return &RedEnvelopeRepository{
		db:                db,
		dongSchema:        dongSchema,
		blockchainService: blockchainService,
		walletRepo:        walletRepo,
		queueService:      nil,
	}
}

func (r *RedEnvelopeRepository) SetQueueService(queueService *RedEnvelopeQueueService) {
	r.queueService = queueService
}

func (r *RedEnvelopeRepository) Create(req *models.CreateRedEnvelopeRequest, creator int64) (*models.RedEnvelope, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				logger.Error().Err(rollbackErr).Msg("Failed to rollback transaction")
			}
		}
	}()

	query := fmt.Sprintf(`
		INSERT INTO %s.red_envelope (
			name, description, total_amount, min_amount, max_amount, 
			total_claims, red_envelope_wallet, owner_wallet, creator, status,
			is_random_distribution, start_date, end_date
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, name, description, total_amount, min_amount, max_amount, 
		          total_claims, claimed_count, red_envelope_wallet, owner_wallet, 
		          creator, status, is_random_distribution, start_date, end_date, 
		          created_at, updated_at
	`, r.dongSchema)

	var result models.RedEnvelope
	ctx := context.Background()
	red_envelope_wallet, err := r.walletRepo.GetOrCreateAvailableWallet(ctx)
	fmt.Println("Red Envelope Wallet:", red_envelope_wallet)
	err = tx.QueryRow(
		query,
		req.Name,
		req.Description,
		req.TotalAmount,
		req.MinAmount,
		req.MaxAmount,
		req.TotalClaims,
		red_envelope_wallet.WalletAddress,
		req.OwnerWallet,
		creator,
		constants.RedEnvelopeStatusPending,
		req.IsRandomDistribution,
		req.StartDate,
		req.EndDate,
	).Scan(
		&result.ID,
		&result.Name,
		&result.Description,
		&result.TotalAmount,
		&result.MinAmount,
		&result.MaxAmount,
		&result.TotalClaims,
		&result.ClaimedCount,
		&result.RedEnvelopeWallet,
		&result.OwnerWallet,
		&result.Creator,
		&result.Status,
		&result.IsRandomDistribution,
		&result.StartDate,
		&result.EndDate,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create red envelope: %w", err)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get or create wallet: %w", err)
	}

	r.walletRepo.UpdateRedEnvelopeInUse(tx, ctx, red_envelope_wallet.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to update red envelope wallet: %w", err)
	}

	var amounts []int64;
	if req.IsRandomDistribution && req.MinAmount != nil && req.MaxAmount != nil {
		amounts, err = utils.GenerateRandomAmounts(req.TotalAmount, int(req.TotalClaims), *req.MinAmount, *req.MaxAmount)
		if err != nil {
			logger.Error().Err(err).Str("red_envelope_id", result.ID).Msg("Failed to generate random amounts")
			return nil, fmt.Errorf("failed to generate random amounts: %w", err)
		}

	} else {
		count := int(req.TotalClaims)
		if count > 0 {
			baseAmount := req.TotalAmount / int64(count)
			remainder := req.TotalAmount % int64(count)

			amounts = make([]int64, count)
			for i := 0; i < count; i++ {
				if int64(i) < remainder {
					amounts[i] = baseAmount + 1
				} else {
					amounts[i] = baseAmount
				}
			}
		}
	}

	if err := r.CreateSplitMoneyBatch(tx, result.ID, amounts); err != nil {
		return nil, fmt.Errorf("failed to save splits: %w", err)
	}
	
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit red envelope: %w", err)
	}

	return &result, nil
}

func (r *RedEnvelopeRepository) GetRedEnvelopeClaimById(id string) ([]models.RedEnvelopeClaim, error) {
	query := fmt.Sprintf(`
		SELECT claimer_wallet, amount, claimed_at, transaction_hash
		FROM %s.red_envelope_claim
		WHERE red_envelope_id = $1 
	`, r.dongSchema)

	rows, err := r.db.Query(query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query red envelope claims: %w", err)
	}
	defer rows.Close()

	var claims []models.RedEnvelopeClaim
	for rows.Next() {
		var claim models.RedEnvelopeClaim
		err := rows.Scan(
			&claim.ClaimerWallet,
			&claim.Amount,
			&claim.ClaimedAt,
			&claim.TransactionHash,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan red envelope claim: %w", err)
		}
		claims = append(claims, claim)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating red envelope claims: %w", err)
	}

	return claims, nil
}

type ClaimAmount struct {
	Id                   int64
	Amount               int64
	Description          string
	IsRandomDistribution bool
}

func (r *RedEnvelopeRepository) GetTotalClaimedAmount(id string) (int64, error) {
	query := fmt.Sprintf(`
		SELECT COALESCE(SUM(amount), 0)
		FROM %s.red_envelope_claim
		WHERE red_envelope_id = $1
	`, r.dongSchema)

	var totalClaimed int64
	err := r.db.QueryRow(query, id).Scan(&totalClaimed)
	if err != nil {
		return 0, fmt.Errorf("failed to get total claimed amount: %w", err)
	}

	return totalClaimed, nil
}

func (r *RedEnvelopeRepository) GetStats(walletAddress string) (map[string]interface{}, error) {
	total_claimed_sent_query := fmt.Sprintf(`
		SELECT 
			COALESCE(SUM(re.total_amount), 0) AS total_sent,
			COUNT(DISTINCT re.id) AS count_sent_envelopes,
			COALESCE(SUM(rec.amount), 0) AS total_claimed,
			COUNT(rec.id) AS count_claimed_envelopes
		FROM %s.red_envelope re
		LEFT JOIN %s.red_envelope_claim rec ON re.id = rec.red_envelope_id
		WHERE re.owner_wallet = $1 AND re.status IN ('PUBLISHED', 'EXPIRED');
	`, r.dongSchema, r.dongSchema)

	var stats struct {
		TotalSend             int64
		CountSentEnvelopes    int64
		TotalClaimed          int64
		CountClaimedEnvelopes int64
		TotalActiveEnvelopes  int64
	}

	err := r.db.QueryRow(total_claimed_sent_query, walletAddress).Scan(
		&stats.TotalSend,
		&stats.CountSentEnvelopes,
		&stats.TotalClaimed,
		&stats.CountClaimedEnvelopes,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	total_active_envelopes_by_user := fmt.Sprintf(`
		SELECT count(id) AS count_envelopes FROM %s.red_envelope
		WHERE owner_wallet = $1 AND status = 'PUBLISHED';
	`, r.dongSchema)

	err = r.db.QueryRow(total_active_envelopes_by_user, walletAddress).Scan(
		&stats.TotalActiveEnvelopes,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	result := map[string]interface{}{
		"total_sent":              stats.TotalSend,
		"count_sent_envelopes":    stats.CountSentEnvelopes,
		"total_claimed":           stats.TotalClaimed,
		"count_claimed_envelopes": stats.CountClaimedEnvelopes,
		"total_active_envelopes":  stats.TotalActiveEnvelopes,
	}

	return result, nil
}

func (r *RedEnvelopeRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	var envelope struct {
		TotalClaims int64
		EndDate     *time.Time
	}

	getQuery := fmt.Sprintf(`
		SELECT total_claims, end_date
		FROM %s.red_envelope
		WHERE id = $1
	`, r.dongSchema)

	err := r.db.QueryRow(getQuery, id).Scan(&envelope.TotalClaims, &envelope.EndDate)
	if err != nil {
		return fmt.Errorf("failed to get red envelope info: %w", err)
	}

	query := fmt.Sprintf(`
		UPDATE %s.red_envelope
		SET status = $1, updated_at = $2
		WHERE id = $3
	`, r.dongSchema)

	result, err := r.db.Exec(query, status, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("red envelope not found")
	}

	if status == constants.RedEnvelopeStatusFailed {
		query := fmt.Sprintf(`
		 SELECT id, name, description, total_amount, min_amount, max_amount, 
			   total_claims, claimed_count, red_envelope_wallet, owner_wallet, 
			   creator, status, transaction_hash, is_random_distribution, 
			   start_date, end_date, created_at, updated_at
		FROM %s.red_envelope
		WHERE id = $1
		`, r.dongSchema)

		envelope := &models.RedEnvelope{}
		err := r.db.QueryRow(query, id).Scan(
			&envelope.ID,
			&envelope.Name,
			&envelope.Description,
			&envelope.TotalAmount,
			&envelope.MinAmount,
			&envelope.MaxAmount,
			&envelope.TotalClaims,
			&envelope.ClaimedCount,
			&envelope.RedEnvelopeWallet,
			&envelope.OwnerWallet,
			&envelope.Creator,
			&envelope.Status,
			&envelope.TransactionHash,
			&envelope.IsRandomDistribution,
			&envelope.StartDate,
			&envelope.EndDate,
			&envelope.CreatedAt,
			&envelope.UpdatedAt,
	 	)

		if err != nil {
			return fmt.Errorf("failed to scan red envelope: %w", err)
		}

		wallet, err := r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to get wallet")
		} else {
			privateKey, err := utils.DecryptPrivateKey(wallet.EncryptedPrivateKey)
			if err != nil {
				logger.Error().Err(err).Msg("Failed to decrypt private key")
			} else {
					extraInfo := `{"type":"lucky-money"}`
					textData := "Red envelope fund"

				txHash, err := r.blockchainService.Transfer(
					envelope.RedEnvelopeWallet,
					envelope.OwnerWallet,
					envelope.TotalAmount,
					privateKey,
					textData,
					extraInfo,
				)
				if err != nil {
						logger.Error().Err(err).Msg("Failed to transfer funds")
					} else {
						logger.Info().
							Str("tx_hash", txHash).
							Int64("amount", envelope.TotalAmount).
							Msg("Successfully transferred remaining balance to owner")
					}
			}
		}
		
	}

	if status == constants.RedEnvelopeStatusPublished && r.queueService != nil {
		ttl := 7 * 24 * time.Hour
		if envelope.EndDate != nil {
			ttl = time.Until(*envelope.EndDate)
			if ttl < 0 {
				ttl = 24 * time.Hour
			}
		}

		err = r.queueService.InitializeRedEnvelope(id, envelope.TotalClaims, ttl)
		if err != nil {
			logger.Error().
				Err(err).
				Str("red_envelope_id", id).
				Msg("Failed to initialize queue for red envelope")
		} else {
			logger.Info().
				Str("red_envelope_id", id).
				Int64("total_claims", envelope.TotalClaims).
				Dur("ttl", ttl).
				Msg("Initialized queue for red envelope")
		}
	}

	return nil
}

func (r *RedEnvelopeRepository) GetExpiredEnvelopes() ([]*models.RedEnvelope, error) {
	query := fmt.Sprintf(`
		SELECT id, name, description, total_amount, min_amount, max_amount, 
			   total_claims, claimed_count, red_envelope_wallet, owner_wallet, 
			   creator, status, transaction_hash, is_random_distribution, 
			   start_date, end_date, created_at, updated_at
		FROM %s.red_envelope
		WHERE status = $1 
		  AND end_date IS NOT NULL 
		  AND end_date < $2
		ORDER BY end_date ASC
	`, r.dongSchema)

	rows, err := r.db.Query(query, constants.RedEnvelopeStatusPublished, time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to get expired red envelopes: %w", err)
	}
	defer rows.Close()

	var envelopes []*models.RedEnvelope
	for rows.Next() {
		envelope := &models.RedEnvelope{}
		err := rows.Scan(
			&envelope.ID,
			&envelope.Name,
			&envelope.Description,
			&envelope.TotalAmount,
			&envelope.MinAmount,
			&envelope.MaxAmount,
			&envelope.TotalClaims,
			&envelope.ClaimedCount,
			&envelope.RedEnvelopeWallet,
			&envelope.OwnerWallet,
			&envelope.Creator,
			&envelope.Status,
			&envelope.TransactionHash,
			&envelope.IsRandomDistribution,
			&envelope.StartDate,
			&envelope.EndDate,
			&envelope.CreatedAt,
			&envelope.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan red envelope: %w", err)
		}
		envelopes = append(envelopes, envelope)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating expired red envelopes: %w", err)
	}

	return envelopes, nil
}

func (r *RedEnvelopeRepository) GetRedEnvelopeCreateByWallet(wallet string, page int, limit int) (models.CreateRedEnvelopeCreateByWallet, error) {
	offset := (page - 1) * limit

	query := fmt.Sprintf(`
		SELECT re.id, re.name, re.total_amount, re.total_claims, re.status, 
		       re.created_at, COALESCE(COUNT(rec.id), 0) AS claimed_count
		FROM %s.red_envelope re
		LEFT JOIN %s.red_envelope_claim rec ON re.id = rec.red_envelope_id
		WHERE re.owner_wallet = $1
		GROUP BY re.id, re.name, re.total_amount, re.total_claims, re.status, re.created_at
		ORDER BY re.created_at DESC
		LIMIT $2 OFFSET $3
	`, r.dongSchema, r.dongSchema)

	var creates []struct {
		ID           string    `json:"id"`
		Name         string    `json:"name"`
		TotalAmount  int64     `json:"total_amount"`
		TotalClaims  int64     `json:"total_claims"`
		Status       string    `json:"status"`
		CreatedAt    time.Time `json:"created_at"`
		ClaimedCount int64     `json:"claimed_count"`
	}

	rows, err := r.db.Query(query, wallet, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get red envelope creates by wallet: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		create := struct {
			ID           string    `json:"id"`
			Name         string    `json:"name"`
			TotalAmount  int64     `json:"total_amount"`
			TotalClaims  int64     `json:"total_claims"`
			Status       string    `json:"status"`
			CreatedAt    time.Time `json:"created_at"`
			ClaimedCount int64     `json:"claimed_count"`
		}{}
		err := rows.Scan(&create.ID, &create.Name, &create.TotalAmount, &create.TotalClaims, &create.Status, &create.CreatedAt, &create.ClaimedCount)
		if err != nil {
			return nil, fmt.Errorf("failed to scan create: %w", err)
		}
		creates = append(creates, create)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating creates: %w", err)
	}

	return creates, nil
}

func (r *RedEnvelopeRepository) GetRedEnvelopeClaimByWallet(wallet string, page int, limit int) (models.ClaimedRedEnvelopeByWallet, error) {
	offset := (page - 1) * limit

	query := fmt.Sprintf(`
		SELECT rec.id, re.id AS red_envelope_id, re.name, re.owner_wallet AS from_wallet, 
		       rec.amount, rec.claimed_at, rec.transaction_hash
		FROM %s.red_envelope_claim rec
		JOIN %s.red_envelope re ON rec.red_envelope_id = re.id
		WHERE rec.claimer_wallet = $1
		ORDER BY rec.claimed_at DESC
		LIMIT $2 OFFSET $3
	`, r.dongSchema, r.dongSchema)

	var claims []struct {
		ID              string    `json:"id"`
		RedEnvelopeID   string    `json:"red_envelope_id"`
		Name            string    `json:"name"`
		FromWallet      string    `json:"from_wallet"`
		Amount          int64     `json:"amount"`
		ClaimedAt       time.Time `json:"claimed_at"`
		TransactionHash *string   `json:"transaction_hash,omitempty"`
	}

	rows, err := r.db.Query(query, wallet, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get red envelope claims by wallet: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		claim := struct {
			ID              string    `json:"id"`
			RedEnvelopeID   string    `json:"red_envelope_id"`
			Name            string    `json:"name"`
			FromWallet      string    `json:"from_wallet"`
			Amount          int64     `json:"amount"`
			ClaimedAt       time.Time `json:"claimed_at"`
			TransactionHash *string   `json:"transaction_hash,omitempty"`
		}{}
		err := rows.Scan(&claim.ID, &claim.RedEnvelopeID, &claim.Name, &claim.FromWallet, &claim.Amount, &claim.ClaimedAt, &claim.TransactionHash)
		if err != nil {
			return nil, fmt.Errorf("failed to scan claim: %w", err)
		}
		claims = append(claims, claim)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating claims: %w", err)
	}

	return claims, nil
}

func (r *RedEnvelopeRepository) GetCountClaimedAmount(wallet string) (int64, error) {
	countClaimByWalletQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.red_envelope_claim
		WHERE claimer_wallet = $1
	`, r.dongSchema)

	var countClaimByWallet int
	err := r.db.QueryRow(countClaimByWalletQuery, wallet).Scan(&countClaimByWallet)
	if err != nil {
		return 0, fmt.Errorf("failed to count claims by wallet: %w", err)
	}

	return int64(countClaimByWallet), nil
}

func (r *RedEnvelopeRepository) GetCountCreatedEnvelope(wallet string) (int64, error) {
	countCreateByWalletQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.red_envelope
		WHERE owner_wallet = $1
	`, r.dongSchema)
	var countCreateByWallet int
	err := r.db.QueryRow(countCreateByWalletQuery, wallet).Scan(&countCreateByWallet)
	if err != nil {
		return 0, fmt.Errorf("failed to count created envelopes by wallet: %w", err)
	}
	return int64(countCreateByWallet), nil
}

func (r *RedEnvelopeRepository) GetDetailRedEnvelopeById(id string, wallet_address string) (models.DetailRedEnvelope, error) {
	query := fmt.Sprintf(`
		SELECT re.name, re.status, re.red_envelope_wallet, re.total_amount, re.total_claims, count(rec.id) AS claimed_count, COALESCE(SUM(rec.amount), 0) AS total_claimed_amount, re.end_date
		FROM %s.red_envelope re
		LEFT JOIN %s.red_envelope_claim rec ON re.id = rec.red_envelope_id
		WHERE re.id = $1 AND re.owner_wallet = $2
		GROUP BY re.name, re.status, re.red_envelope_wallet, re.total_amount, re.total_claims, re.end_date
	`, r.dongSchema, r.dongSchema)
	var result struct {
		Name               string
		Status             string
		RedEnvelopeWallet  string
		TotalAmount        int64
		TotalClaim         int64
		ClaimedCount       int64
		TotalClaimedAmount int64
		EndDate            *time.Time
	}
	err := r.db.QueryRow(query, id, wallet_address).
		Scan(
			&result.Name,
			&result.Status,
			&result.RedEnvelopeWallet,
			&result.TotalAmount,
			&result.TotalClaim,
			&result.ClaimedCount,
			&result.TotalClaimedAmount,
			&result.EndDate,
		)
	if err != nil {
		return models.DetailRedEnvelope{}, fmt.Errorf("failed to get red envelope detail: %w", err)
	}
	return models.DetailRedEnvelope{
		Name:               result.Name,
		Status:             result.Status,
		RedEnvelopeWallet:  result.RedEnvelopeWallet,
		TotalAmount:        result.TotalAmount,
		TotalClaim:         result.TotalClaim,
		ClaimedCount:       result.ClaimedCount,
		TotalClaimedAmount: result.TotalClaimedAmount,
		EndDate:            result.EndDate,
	}, nil

}

func (r *RedEnvelopeRepository) CreateSplitMoneyBatch(tx *sql.Tx, redEnvelopeID string, amounts []int64) error {
	if len(amounts) == 0 {
		return nil
	}

	args := make([]interface{}, 0, len(amounts)*3)
	placeholders := make([]string, 0, len(amounts))

	for i, amount := range amounts {
		n := i * 3
		placeholders = append(placeholders, fmt.Sprintf("($%d, $%d, $%d)", n + 1, n + 2, n + 3))
		args = append(args, redEnvelopeID, amount, i+1)
	}

	query := fmt.Sprintf(
		"INSERT INTO %s.red_envelope_split_money (red_envelope_id, amount, claim_order) VALUES %s",
		r.dongSchema,
		strings.Join(placeholders, ","),
	)

	_, err := tx.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to batch insert split money (count: %d): %w", len(amounts), err)
	}

	return nil
}

func (r *RedEnvelopeRepository) GetRedEnvelopeCloseSesssion(redEnvelopeID string) (models.RedEnvelopeCloseSesssion, error) {
	query := fmt.Sprintf(`
		SELECT COALESCE(SUM(rem.amount), 0), re.red_envelope_wallet, re.owner_wallet
		FROM %s.red_envelope_split_money rem
		LEFT JOIN %s.red_envelope re ON re.id = rem.red_envelope_id
		WHERE rem.red_envelope_id = $1 AND rem.status != $2
		GROUP BY re.red_envelope_wallet, re.owner_wallet
	`, r.dongSchema, r.dongSchema)
	var envelope struct {
		TotalAmount       int64
		RedEnvelopeWallet string
		OwnerWallet       string
	}
	err := r.db.QueryRow(query, redEnvelopeID, constants.RedEnvelopeSplitMoneyStatusClaimed).Scan(&envelope.TotalAmount, &envelope.RedEnvelopeWallet, &envelope.OwnerWallet)
	if err != nil {
		return models.RedEnvelopeCloseSesssion{}, fmt.Errorf("failed to get remaining amount: %w", err)
	}
	return envelope, nil
}

func (r *RedEnvelopeRepository) CheckWalletAndEnvelopeId(redEnvelopeID string, walletAddress string) (bool, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.red_envelope
		WHERE id = $1 AND owner_wallet = $2
	`, r.dongSchema)
	var count int
	err := r.db.QueryRow(query, redEnvelopeID, walletAddress).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check wallet and envelope id: %w", err)
	}

	return count > 0, nil
}

func (r *RedEnvelopeRepository) CloseSession(redEnvelopeID string, walletAddress string) error {
	is_close, err := r.CheckWalletAndEnvelopeId(redEnvelopeID, walletAddress)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Str("wallet_address", walletAddress).
			Msg("Failed to check wallet and envelope id")
		return err
	}
	if !is_close {
		logger.Error().
			Str("red_envelope_id", redEnvelopeID).
			Str("wallet_address", walletAddress).
			Msg("Wallet address does not match owner of red envelope")
		return fmt.Errorf("wallet address does not match owner of red envelope")
	}

	ctx := context.Background()
	totalClaimed, err := r.GetTotalClaimedAmount(redEnvelopeID)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Msg("Failed to get total claimed amount")
		return err
	}

	envelope, err := r.GetRedEnvelopeCloseSesssion(redEnvelopeID)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Msg("Failed to get total claimed amount")
	}

	remainingBalance := envelope.TotalAmount - totalClaimed

	if remainingBalance > 0 {
		logger.Info().
			Str("red_envelope_id", redEnvelopeID).
			Int64("remaining_balance", remainingBalance).
			Str("red_envelope_wallet", envelope.RedEnvelopeWallet).
			Str("owner_wallet", envelope.OwnerWallet).
			Msg("Transferring remaining balance back to owner")

		wallet, err := r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to get wallet")
		} else {
			privateKey, err := utils.DecryptPrivateKey(wallet.EncryptedPrivateKey)
			if err != nil {
				logger.Error().Err(err).Msg("Failed to decrypt private key")
			} else {
				extraInfo := `{"type":"lucky-money"}`
				textData := "Red envelope fund"

				txHash, err := r.blockchainService.Transfer(
					envelope.RedEnvelopeWallet,
					envelope.OwnerWallet,
					remainingBalance,
					privateKey,
					textData,
					extraInfo,
				)
				if err != nil {
					logger.Error().Err(err).Msg("Failed to transfer funds")
				} else {
					logger.Info().
						Str("tx_hash", txHash).
						Int64("amount", remainingBalance).
						Msg("Successfully transferred remaining balance to owner")
				}
			}
		}
	}

	err = r.UpdateStatus(ctx, redEnvelopeID, constants.RedEnvelopeStatusExpired)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Msg("Failed to update status to EXPIRED")
	}

	return nil
}
