package repository

import (
	"context"
	"database/sql"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/utils"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
)

type RedEnvelopeRepository struct {
	db                *sql.DB
	dongSchema        string
	blockchainService *blockchain.BlockchainService
	walletRepo        *IntermediaryWalletRepository
	queueService      *RedEnvelopeQueueService
}

func NewRedEnvelopeRepository(db *sql.DB, dongSchema string, blockchainService *blockchain.BlockchainService, walletRepo *IntermediaryWalletRepository, queueService *RedEnvelopeQueueService) *RedEnvelopeRepository {
	return &RedEnvelopeRepository{
		db:                db,
		dongSchema:        dongSchema,
		blockchainService: blockchainService,
		walletRepo:        walletRepo,
		queueService:      queueService,
	}
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
	redEnvelopeWallet, err := r.walletRepo.GetOrCreateAvailableWallet(ctx, tx)
	fmt.Println("Red Envelope Wallet:", redEnvelopeWallet)
	err = tx.QueryRow(
		query,
		req.Name,
		req.Description,
		req.TotalAmount,
		req.MinAmount,
		req.MaxAmount,
		req.TotalClaims,
		redEnvelopeWallet.WalletAddress,
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
		return nil, fmt.Errorf("failed to get or create wallet: %w", err)
	}

	err = r.walletRepo.UpdateIntermediaryWalletStatus(tx, ctx, redEnvelopeWallet.ID, constants.WalletTypeRedEnvelope)

	if err != nil {
		return nil, fmt.Errorf("failed to update red envelope wallet: %w", err)
	}

	var amounts []int64
	if req.IsRandomDistribution && req.MinAmount != nil && req.MaxAmount != nil {
		amounts, err = utils.GenerateRandomAmounts(req.TotalAmount, *req.MinAmount, *req.MaxAmount, int(req.TotalClaims))
		if err != nil {
			logger.Error().Err(err).Str("red_envelope_id", result.ID).Msg("Failed to generate random amounts")
			return nil, fmt.Errorf("failed to generate random amounts: %w", err)
		}
	} else {
		totalClaims := req.TotalClaims
		baseAmount := req.TotalAmount / totalClaims
		remainder := req.TotalAmount % totalClaims

		amounts = make([]int64, totalClaims)
		for i := int64(0); i < totalClaims; i++ {
			if i < remainder {
				amounts[i] = baseAmount + 1
			} else {
				amounts[i] = baseAmount
			}
		}
	}

	if err = r.CreateSplitMoneyBatch(tx, result.ID, amounts); err != nil {
		return nil, fmt.Errorf("failed to save splits: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit red envelope: %w", err)
	}

	return &result, nil
}

func (r *RedEnvelopeRepository) GetRecipientsByRedEnvelopeID(id string) ([]models.RedEnvelopeClaim, error) {
	query := fmt.Sprintf(`
		SELECT claimer_wallet, amount, claimed_at, transaction_hash
		FROM %s.red_envelope_claim
		WHERE red_envelope_id = $1 
	`, r.dongSchema)

	rows, err := r.db.Query(query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query red envelope claims: %w", err)
	}
	defer func() {
		if err = rows.Close(); err != nil {
			logger.Error().Err(err).Msg("Failed to close rows")
		}
	}()

	var claims []models.RedEnvelopeClaim
	for rows.Next() {
		var claim models.RedEnvelopeClaim
		err = rows.Scan(
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

func (r *RedEnvelopeRepository) GetStatsByUser(userID int64) (map[string]interface{}, error) {
	totalSentQuery := fmt.Sprintf(`
		SELECT 
			COALESCE(SUM(re.total_amount), 0) AS total_sent,
			COUNT(DISTINCT re.id) AS count_sent_envelopes
		FROM %s.red_envelope re
		WHERE re.creator = $1 AND re.status = ANY($2);
	`, r.dongSchema)

	listStatus := []string{
		constants.RedEnvelopeStatusPublished,
		constants.RedEnvelopeStatusExpired,
	}

	var stats struct {
		TotalSend             int64
		CountSentEnvelopes    int64
		TotalClaimed          int64
		CountClaimedEnvelopes int64
		TotalActiveEnvelopes  int64
	}

	err := r.db.QueryRow(totalSentQuery, userID, pq.Array(listStatus)).Scan(
		&stats.TotalSend,
		&stats.CountSentEnvelopes,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	totalClaimedQuery := fmt.Sprintf(`
		SELECT 
			COALESCE(SUM(rec.amount), 0) AS total_claimed,
			COUNT(rec.id) AS count_claimed_envelopes
		FROM %s.red_envelope_claim rec
		WHERE rec.claimer_user_id = $1;
	`, r.dongSchema)

	err = r.db.QueryRow(totalClaimedQuery, userID).Scan(
		&stats.TotalClaimed,
		&stats.CountClaimedEnvelopes,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	totalActiveEnvelopesByUserQuery := fmt.Sprintf(`
		SELECT COALESCE(count(id), 0) AS count_envelopes FROM %s.red_envelope
		WHERE creator = $1 AND status = 'PUBLISHED';
	`, r.dongSchema)

	err = r.db.QueryRow(totalActiveEnvelopesByUserQuery, userID).Scan(
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

func (r *RedEnvelopeRepository) GetStats() (map[string]interface{}, error) {
	query := fmt.Sprintf(`
		SELECT 
			(SELECT COALESCE(SUM(rec.amount), 0) FROM %s.red_envelope_claim rec) AS total_claimed,
			(SELECT COALESCE(COUNT(id), 0) FROM %s.red_envelope WHERE status = $1) AS count_active_envelopes
	`, r.dongSchema, r.dongSchema)

	var stats struct {
		TotalClaimed         int64
		TotalActiveEnvelopes int64
	}

	err := r.db.QueryRow(query, constants.RedEnvelopeStatusPublished).Scan(
		&stats.TotalClaimed,
		&stats.TotalActiveEnvelopes,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	result := map[string]interface{}{
		"total_claimed":          stats.TotalClaimed,
		"total_active_envelopes": stats.TotalActiveEnvelopes,
	}

	return result, nil
}

func (r *RedEnvelopeRepository) UpdateStatus(ctx context.Context, id, status string) error {
	query := fmt.Sprintf(`
		UPDATE %s.red_envelope
		SET status = $1, updated_at = $2
		WHERE id = $3
		RETURNING red_envelope_wallet, owner_wallet, total_amount, total_claims, end_date
	`, r.dongSchema)

	var envelope struct {
		RedEnvelopeWallet string
		OwnerWallet       string
		TotalAmount       int64
		TotalClaims       int64
		EndDate           *time.Time
	}

	err := r.db.QueryRowContext(ctx, query, status, time.Now(), id).Scan(
		&envelope.RedEnvelopeWallet,
		&envelope.OwnerWallet,
		&envelope.TotalAmount,
		&envelope.TotalClaims,
		&envelope.EndDate,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("red envelope not found")
		}
		return fmt.Errorf("failed to update status and fetch envelope: %w", err)
	}

	if status == constants.RedEnvelopeStatusFailed {
		var wallet *models.IntermediaryWallet
		wallet, err = r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to get wallet")
		} else {
			_, err = r.blockchainService.TransferMoney(wallet.EncryptedPrivateKey, envelope.RedEnvelopeWallet, envelope.OwnerWallet, envelope.TotalAmount)
			if err != nil {
				return fmt.Errorf("failed to transfer money to owner wallet: %w", err)
			}
		}
	}

	if status == constants.RedEnvelopeStatusPublished && r.queueService != nil {
		ttl := 2 * 24 * time.Hour
		if envelope.EndDate != nil {
			ttl = time.Until(*envelope.EndDate)
			if ttl < 0 {
				ttl = 24 * time.Hour
			}
		}

		logger.Info().Msg("test")
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
	defer func() {
		if err = rows.Close(); err != nil {
			logger.Error().Err(err).Msg("Failed to close rows")
		}
	}()

	var envelopes []*models.RedEnvelope
	for rows.Next() {
		envelope := &models.RedEnvelope{}
		err = rows.Scan(
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

func (r *RedEnvelopeRepository) GetRedEnvelopeCreatedByUser(userID int64, page, limit int) (models.CreateRedEnvelopeCreateByUser, error) {
	offset := (page - 1) * limit

	query := fmt.Sprintf(`
		SELECT re.id, re.name, re.total_amount, re.total_claims, re.status, 
		       re.created_at, COALESCE(COUNT(rec.id), 0) AS claimed_count
		FROM %s.red_envelope re
		LEFT JOIN %s.red_envelope_claim rec ON re.id = rec.red_envelope_id
		WHERE re.creator = $1
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

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get red envelope creates by wallet: %w", err)
	}
	defer func() {
		if err = rows.Close(); err != nil {
			logger.Error().Err(err).Msg("Failed to close rows")
		}
	}()

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
		err = rows.Scan(&create.ID, &create.Name, &create.TotalAmount, &create.TotalClaims, &create.Status, &create.CreatedAt, &create.ClaimedCount)
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

func (r *RedEnvelopeRepository) GetRedEnvelopeClaimedByUser(userID int64, page, limit int) (models.ClaimedRedEnvelopeByUser, error) {
	offset := (page - 1) * limit

	query := fmt.Sprintf(`
		SELECT rec.id, re.id AS red_envelope_id, re.name, re.owner_wallet AS from_wallet, 
		       rec.amount, rec.claimed_at, rec.transaction_hash
		FROM %s.red_envelope_claim rec
		JOIN %s.red_envelope re ON rec.red_envelope_id = re.id
		WHERE rec.claimer_user_id = $1
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

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get red envelope claims by wallet: %w", err)
	}
	defer func() {
		if err = rows.Close(); err != nil {
			logger.Error().Err(err).Msg("Failed to close rows")
		}
	}()

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
		err = rows.Scan(&claim.ID, &claim.RedEnvelopeID, &claim.Name, &claim.FromWallet, &claim.Amount, &claim.ClaimedAt, &claim.TransactionHash)
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

func (r *RedEnvelopeRepository) GetCountClaimedAmount(userID int64) (int64, error) {
	countClaimByWalletQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.red_envelope_claim rec
		WHERE rec.claimer_user_id = $1
	`, r.dongSchema)

	var countClaimByWallet int
	err := r.db.QueryRow(countClaimByWalletQuery, userID).Scan(&countClaimByWallet)
	if err != nil {
		return 0, fmt.Errorf("failed to count claims by wallet: %w", err)
	}

	return int64(countClaimByWallet), nil
}

func (r *RedEnvelopeRepository) GetCountCreatedEnvelope(userID int64) (int64, error) {
	countCreateByWalletQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.red_envelope
		WHERE creator = $1
	`, r.dongSchema)
	var countCreateByWallet int
	err := r.db.QueryRow(countCreateByWalletQuery, userID).Scan(&countCreateByWallet)
	if err != nil {
		return 0, fmt.Errorf("failed to count created envelopes by wallet: %w", err)
	}
	return int64(countCreateByWallet), nil
}

func (r *RedEnvelopeRepository) GetDetailRedEnvelopeByID(id string) (models.DetailRedEnvelope, error) {
	query := fmt.Sprintf(`
		SELECT re.name, re.status, re.red_envelope_wallet, re.total_amount, re.total_claims, count(rec.id) AS claimed_count, COALESCE(SUM(rec.amount), 0) AS total_claimed_amount, re.end_date
		FROM %s.red_envelope re
		LEFT JOIN %s.red_envelope_claim rec ON re.id = rec.red_envelope_id
		WHERE re.id = $1 
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
	err := r.db.QueryRow(query, id).
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
		placeholders = append(placeholders, fmt.Sprintf("($%d, $%d, $%d)", n+1, n+2, n+3))
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

func (r *RedEnvelopeRepository) CheckUserIDAndEnvelopeID(redEnvelopeID string, userID int64) (bool, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s.red_envelope
		WHERE id = $1 AND creator = $2
	`, r.dongSchema)
	var count int
	err := r.db.QueryRow(query, redEnvelopeID, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check user id and envelope id: %w", err)
	}

	return count > 0, nil
}

func (r *RedEnvelopeRepository) CloseSession(redEnvelopeID string, userID int64) error {
	canClose, err := r.CheckUserIDAndEnvelopeID(redEnvelopeID, userID)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Int64("user_id", userID).
			Msg("Failed to check user id and envelope id")
		return err
	}
	if !canClose {
		logger.Error().
			Str("red_envelope_id", redEnvelopeID).
			Int64("user_id", userID).
			Msg("User ID does not match owner of red envelope")
		return err
	}

	ctx := context.Background()

	envelope, err := r.GetRedEnvelopeCloseSesssion(redEnvelopeID)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Msg("Failed to get total claimed amount")
	}

	if envelope.TotalAmount > 0 {
		logger.Info().
			Str("red_envelope_id", redEnvelopeID).
			Int64("remaining_balance", envelope.TotalAmount).
			Str("red_envelope_wallet", envelope.RedEnvelopeWallet).
			Str("owner_wallet", envelope.OwnerWallet).
			Msg("Transferring remaining balance back to owner")

		var wallet *models.IntermediaryWallet
		wallet, err = r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to get wallet")
		} else {
			_, err = r.blockchainService.TransferMoney(wallet.EncryptedPrivateKey, envelope.RedEnvelopeWallet, envelope.OwnerWallet, envelope.TotalAmount)
			if err != nil {
				return err
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

func (r *RedEnvelopeRepository) GetClaimAmount(id, walletAddress string, claimStatus int, userID int64) (models.ClaimAmount, error) {
	query := fmt.Sprintf(`
		SELECT total_amount, description, total_claims
		FROM %s.red_envelope
		WHERE id = $1 AND status = $2
	`, r.dongSchema)

	var envelope struct {
		TotalAmount int64
		Description string
		TotalClaims int64
	}
	err := r.db.QueryRow(query, id, constants.RedEnvelopeStatusPublished).Scan(
		&envelope.TotalAmount,
		&envelope.Description,
		&envelope.TotalClaims,
	)

	if err == sql.ErrNoRows {
		return models.ClaimAmount{}, fmt.Errorf("red envelope not found or expiry")
	}
	if err != nil {
		logger.Error().Err(err).Str("id", id).Msg("failed to get red envelope")
		return models.ClaimAmount{}, fmt.Errorf("failed to get red envelope")
	}

	tx, err := r.db.Begin()
	if err != nil {
		return models.ClaimAmount{}, fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if err != nil {
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				logger.Error().Err(rollbackErr).Msg("Failed to rollback transaction")
			}
		}
	}()

	if claimStatus == constants.ClaimStatusAlreadyQueued {
		query := fmt.Sprintf(`
			SELECT id, red_envelope_id, amount, status, claimed_user_id, claim_order, claimed_address, claimed_at, created_at
			FROM %s.red_envelope_split_money
			WHERE red_envelope_id = $1 AND claimed_address = $2 AND status = $3
			LIMIT 1
		`, r.dongSchema)

		var existingSplit models.RedEnvelopeSplitMoney

		err = tx.QueryRow(query, id, walletAddress, constants.RedEnvelopeSplitMoneyStatusReserved).Scan(
			&existingSplit.ID,
			&existingSplit.RedEnvelopeID,
			&existingSplit.Amount,
			&existingSplit.Status,
			&existingSplit.ClaimedUserID,
			&existingSplit.ClaimOrder,
			&existingSplit.ClaimedAddress,
			&existingSplit.ClaimedAt,
			&existingSplit.CreatedAt,
		)

		if err == sql.ErrNoRows {
			return models.ClaimAmount{}, constants.ErrAlreadyClaimed
		} else if err != nil {
			logger.Error().Err(err).Msg("Failed to query existing split")
			return models.ClaimAmount{}, fmt.Errorf("query failed: %w", err)
		}

		return models.ClaimAmount{
			ID:          existingSplit.ID,
			Amount:      existingSplit.Amount,
			Description: envelope.Description,
		}, nil
	}

	split, err := r.GetNextAvailableSplit(tx, id, walletAddress, userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get next available split")
		return models.ClaimAmount{}, fmt.Errorf("all claim attempts for this red envelope have been used")
	}

	if err := tx.Commit(); err != nil {
		return models.ClaimAmount{}, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return models.ClaimAmount{
		ID:          split.ID,
		Amount:      split.Amount,
		Description: envelope.Description,
	}, nil
}

func (r *RedEnvelopeRepository) ExecuteClaim(id, claimerWallet string, claimerUserID, splitMoneyID int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				logger.Error().Err(rollbackErr).Msg("Failed to rollback transaction")
			}
		}
	}()

	envelopeQuery := fmt.Sprintf(`
		SELECT id, name, description, total_amount, total_claims, claimed_count, 
			   red_envelope_wallet, status
		FROM %s.red_envelope
		WHERE id = $1
		FOR UPDATE
	`, r.dongSchema)

	var envelope struct {
		ID                string
		Name              string
		Description       *string
		TotalAmount       int64
		TotalClaims       int64
		ClaimedCount      int64
		RedEnvelopeWallet string
		Status            string
	}

	err = tx.QueryRow(envelopeQuery, id).Scan(
		&envelope.ID,
		&envelope.Name,
		&envelope.Description,
		&envelope.TotalAmount,
		&envelope.TotalClaims,
		&envelope.ClaimedCount,
		&envelope.RedEnvelopeWallet,
		&envelope.Status,
	)

	if err != nil {
		logger.Error().Err(err).Str("id", id).Msg("Failed to get envelope")
		return fmt.Errorf("unable to access red envelope information")
	}

	if envelope.Status != constants.RedEnvelopeStatusPublished {
		return fmt.Errorf("red envelope is not published")
	}

	if envelope.ClaimedCount >= envelope.TotalClaims {
		return fmt.Errorf("red envelope is fully claimed")
	}

	claimAmount, err := r.GetAmountBySplitID(splitMoneyID)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get claim amount")
		return fmt.Errorf("failed to get claim amount")
	}

	ctx := context.Background()
	walletInfo, err := r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get wallet info")
		return fmt.Errorf("failed to get wallet info")
	}

	var txHash string
	txHash, err = r.blockchainService.TransferMoney(walletInfo.EncryptedPrivateKey, envelope.RedEnvelopeWallet, claimerWallet, claimAmount)
	if err != nil {
		logger.Error().Err(err).
			Str("from", envelope.RedEnvelopeWallet).
			Str("to", claimerWallet).
			Msg("Blockchain transfer failed")
		return fmt.Errorf("failed to transfer money")
	}

	claimQuery := fmt.Sprintf(`
		INSERT INTO %s.red_envelope_claim (
			red_envelope_id, claimer_wallet, claimer_user_id, amount, transaction_hash
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, red_envelope_id, claimer_wallet, claimer_user_id, amount, claimed_at, transaction_hash
	`, r.dongSchema)

	var claim models.RedEnvelopeClaim
	err = tx.QueryRow(
		claimQuery,
		id,
		claimerWallet,
		claimerUserID,
		claimAmount,
		txHash,
	).Scan(
		&claim.ID,
		&claim.RedEnvelopeID,
		&claim.ClaimerWallet,
		&claim.ClaimerUserID,
		&claim.Amount,
		&claim.ClaimedAt,
		&claim.TransactionHash,
	)

	if err != nil {
		logger.Error().Err(err).Str("txHash", txHash).Msg("failed to create claim")
		return fmt.Errorf("failed to create claim")
	}

	updateQuery := fmt.Sprintf(`
		UPDATE %s.red_envelope
		SET claimed_count = claimed_count + 1,
			updated_at = $1
		WHERE id = $2
	`, r.dongSchema)

	_, err = tx.Exec(updateQuery, time.Now(), id)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to update claimed count")
		return fmt.Errorf("failed to update claimed count")
	}

	err = r.MarkSplitAsClaimed(tx, splitMoneyID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to mark split as claimed")
		return fmt.Errorf("failed to mark split as claimed")
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *RedEnvelopeRepository) GetNextAvailableSplit(tx *sql.Tx, redEnvelopeID, walletAddress string, userID int64) (*models.RedEnvelopeSplitMoney, error) {
	query := fmt.Sprintf(`
        SELECT id, red_envelope_id, amount, status, claim_order, claimed_user_id, claimed_address, claimed_at, created_at
        FROM %s.red_envelope_split_money
        WHERE red_envelope_id = $1 AND status = $2
        ORDER BY claim_order ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    `, r.dongSchema)

	var split models.RedEnvelopeSplitMoney

	err := tx.QueryRow(query, redEnvelopeID, constants.RedEnvelopeSplitMoneyStatusAvailable).Scan(
		&split.ID,
		&split.RedEnvelopeID,
		&split.Amount,
		&split.Status,
		&split.ClaimOrder,
		&split.ClaimedUserID,
		&split.ClaimedAddress,
		&split.ClaimedAt,
		&split.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get next split: %w", err)
	}

	updateQuery := fmt.Sprintf(`
        UPDATE %s.red_envelope_split_money
        SET status = $1, updated_at = NOW(), claimed_address = $2, claimed_user_id = $3
        WHERE id = $4 AND status = $5
    `, r.dongSchema)

	_, err = tx.Exec(updateQuery, constants.RedEnvelopeSplitMoneyStatusReserved, walletAddress, userID, split.ID, constants.RedEnvelopeSplitMoneyStatusAvailable)
	if err != nil {
		return nil, fmt.Errorf("failed to reserve split: %w", err)
	}

	return &split, nil
}

func (r *RedEnvelopeRepository) GetAmountBySplitID(splitMoneyID int64) (int64, error) {
	query := fmt.Sprintf(`
        SELECT amount
        FROM %s.red_envelope_split_money
        WHERE id = $1 AND status = $2
    `, r.dongSchema)

	var amount int64
	err := r.db.QueryRow(query, splitMoneyID, constants.RedEnvelopeSplitMoneyStatusReserved).Scan(
		&amount,
	)

	if err == sql.ErrNoRows {
		return 0, fmt.Errorf("no available splits remaining")
	}
	if err != nil {
		return 0, fmt.Errorf("failed to get next split: %w", err)
	}

	return amount, nil
}

func (r *RedEnvelopeRepository) MarkSplitAsClaimed(tx *sql.Tx, splitID int64) error {
	query := fmt.Sprintf(`
        UPDATE %s.red_envelope_split_money
        SET status = $1, 
            claimed_at = NOW()
        WHERE id = $2 AND status = $3
    `, r.dongSchema)

	result, err := tx.Exec(query, constants.RedEnvelopeSplitMoneyStatusClaimed, splitID, constants.RedEnvelopeSplitMoneyStatusReserved)
	if err != nil {
		return fmt.Errorf("failed to mark split as claimed: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("split already claimed or does not exist")
	}

	return nil
}

func (r *RedEnvelopeRepository) CheckUserIDClaimNotMatch(redEnvelopeID string, userID, splitMoneyID int64) (bool, error) {
	query := fmt.Sprintf(`
			SELECT claimed_user_id
			FROM %s.red_envelope_split_money
			WHERE id = $1 AND red_envelope_id = $2 AND status = $3
		`, r.dongSchema)

	var claimedUserID int64
	err := r.db.QueryRow(query, splitMoneyID, redEnvelopeID, constants.RedEnvelopeSplitMoneyStatusReserved).Scan(&claimedUserID)
	if err != nil {
		return false, fmt.Errorf("failed to get claimed user id: %w", err)
	}

	return userID == claimedUserID, nil
}
