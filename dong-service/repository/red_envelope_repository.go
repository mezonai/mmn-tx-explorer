package repository

import (
	"context"
	"database/sql"
	"dong-service/blockchain"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/types"
	"dong-service/utils"
	"errors"
	"fmt"
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
	redEnvelopeWallet, err := r.walletRepo.GetOrCreateAvailableWallet(ctx, tx, constants.WalletTypeRedEnvelope)
	if err != nil {
		return nil, fmt.Errorf("failed to get or create available wallet: %w", err)
	}

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
		  AND status = 'SUCCESS'
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
			COALESCE(SUM(rec.amount), 0) AS total_sent,
			COALESCE(COUNT(rec.claimer_user_id), 0) AS total_recipients 
		FROM %s.red_envelope re
		JOIN %s.red_envelope_claim rec ON rec.red_envelope_id = re.id
		WHERE re.creator = $1 AND re.status = ANY($2);
	`, r.dongSchema, r.dongSchema)

	listStatus := []string{
		constants.RedEnvelopeStatusPublished,
		constants.RedEnvelopeStatusExpired,
	}

	var stats struct {
		TotalSend             int64
		TotalRecipients       int64
		TotalClaimed          int64
		CountClaimedEnvelopes int64
		TotalActiveEnvelopes  int64
	}

	err := r.db.QueryRow(totalSentQuery, userID, pq.Array(listStatus)).Scan(
		&stats.TotalSend,
		&stats.TotalRecipients,
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
		"total_recipients":        stats.TotalRecipients,
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
			(SELECT COALESCE(COUNT(id), 0) FROM %s.red_envelope WHERE claimed_count > 0) AS total_envelopes
	`, r.dongSchema, r.dongSchema)

	var stats struct {
		TotalClaimed   int64
		TotalEnvelopes int64
	}

	err := r.db.QueryRow(query).Scan(
		&stats.TotalClaimed,
		&stats.TotalEnvelopes,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	result := map[string]interface{}{
		"total_claimed":   stats.TotalClaimed,
		"total_envelopes": stats.TotalEnvelopes,
	}

	return result, nil
}

func (r *RedEnvelopeRepository) UpdateRedEnvelope(ctx context.Context, id, status string, txHash *string) (string, error) {
	var (
		envelope struct {
			ID                   string
			Name                 string
			Description          *string
			RedEnvelopeWallet    string
			OwnerWallet          string
			TotalAmount          int64
			TotalClaims          int64
			EndDate              time.Time
			IsRandomDistribution bool
			MinAmount            *int64
			MaxAmount            *int64
		}
		err error
	)

	setClauses := "status = $1, updated_at = $2"
	args := []any{status, time.Now()}

	if txHash != nil {
		args = append(args, *txHash)
		setClauses += fmt.Sprintf(`, transaction_hash = $%d`, len(args))
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE %s.red_envelope
		SET %s
		WHERE id = $%d
		RETURNING id, name, description, red_envelope_wallet, owner_wallet, total_amount, total_claims, end_date, is_random_distribution, min_amount, max_amount
	`, r.dongSchema, setClauses, len(args))

	err = r.db.QueryRowContext(ctx, query, args...).Scan(
		&envelope.ID,
		&envelope.Name,
		&envelope.Description,
		&envelope.RedEnvelopeWallet,
		&envelope.OwnerWallet,
		&envelope.TotalAmount,
		&envelope.TotalClaims,
		&envelope.EndDate,
		&envelope.IsRandomDistribution,
		&envelope.MinAmount,
		&envelope.MaxAmount,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", fmt.Errorf("red envelope not found")
		}
		return "", fmt.Errorf("failed to update status and fetch envelope: %w", err)
	}

	if status == constants.RedEnvelopeStatusFailed {
		var wallet *models.IntermediaryWallet
		wallet, err = r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to get wallet")
		} else {
			// TODO: update pass amount from envelope
			amount := types.NewBigIntString(envelope.TotalAmount).Multiply(constants.TokenMultiplierBigIntString)
			_, err = r.blockchainService.TransferMoney(wallet.EncryptedPrivateKey, envelope.RedEnvelopeWallet, envelope.OwnerWallet, amount.String(), constants.TextDataLuckyMoney, constants.ExtraInfoLuckyMoney)
			if err != nil {
				return "", fmt.Errorf("failed to transfer money to owner wallet: %w", err)
			}
		}
	}

	if status == constants.RedEnvelopeStatusPublished && r.queueService != nil {
		ttl := 2 * 24 * time.Hour
		ttl = time.Until(envelope.EndDate)
		if ttl < 0 {
			ttl = 24 * time.Hour
		}

		var amounts []int64
		if envelope.IsRandomDistribution && envelope.MinAmount != nil && envelope.MaxAmount != nil {
			amounts, err = utils.GenerateRandomAmounts(envelope.TotalAmount, *envelope.MinAmount, *envelope.MaxAmount, int(envelope.TotalClaims))
			if err != nil {
				logger.Error().Err(err).Str("red_envelope_id", envelope.ID).Msg("Failed to generate random amounts")
				return "", fmt.Errorf("failed to generate random amounts: %w", err)
			}
		} else {
			totalClaims := envelope.TotalClaims
			baseAmount := envelope.TotalAmount / totalClaims
			remainder := envelope.TotalAmount % totalClaims

			amounts = make([]int64, totalClaims)
			for i := int64(0); i < totalClaims; i++ {
				if i < remainder {
					amounts[i] = baseAmount + 1
				} else {
					amounts[i] = baseAmount
				}
			}
		}

		var descriptionStr string
		if envelope.Description != nil {
			descriptionStr = *envelope.Description
		}
		err = r.queueService.InitializeRedEnvelope(id, amounts, descriptionStr, ttl)
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

	return envelope.RedEnvelopeWallet, nil
}

func (r *RedEnvelopeRepository) GetExpiredEnvelopes() ([]*models.RedEnvelope, error) {
	query := fmt.Sprintf(`
		SELECT id, name, description, total_amount, min_amount, max_amount, 
			   total_claims, claimed_count, red_envelope_wallet, owner_wallet, 
			   creator, status, transaction_hash, is_random_distribution, 
			   start_date, end_date, created_at, updated_at
		FROM %s.red_envelope
		WHERE status = ANY($1)
		  AND end_date < $2
		ORDER BY end_date ASC
	`, r.dongSchema)

	statuses := []string{constants.RedEnvelopeStatusPublished, constants.RedEnvelopeStatusPending}
	rows, err := r.db.Query(query, pq.Array(statuses), time.Now())
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
		EndDate            time.Time
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
		EndDate:            &result.EndDate,
	}, nil
}

func (r *RedEnvelopeRepository) GetRedEnvelopeCloseSesssion(redEnvelopeID string) (models.RedEnvelopeCloseSesssion, error) {
	query := fmt.Sprintf(`
		SELECT 
				(re.total_amount - COALESCE(SUM(rec.amount), 0)) AS remaining_amount,
				re.red_envelope_wallet, re.owner_wallet
		FROM %s.red_envelope re
		LEFT JOIN %s.red_envelope_claim rec ON re.id = rec.red_envelope_id
		WHERE re.id = $1
		GROUP BY re.id, re.total_amount, re.red_envelope_wallet, re.owner_wallet;
	`, r.dongSchema, r.dongSchema)

	var envelope models.RedEnvelopeCloseSesssion

	err := r.db.QueryRow(query, redEnvelopeID).Scan(&envelope.RemainingAmount, &envelope.RedEnvelopeWallet, &envelope.OwnerWallet)
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

func (r *RedEnvelopeRepository) CloseSession(redEnvelopeID string, userID int64) (string, error) {
	canClose, err := r.CheckUserIDAndEnvelopeID(redEnvelopeID, userID)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Int64("user_id", userID).
			Msg("Failed to check user id and envelope id")
		return "", err
	}
	if !canClose {
		logger.Error().
			Str("red_envelope_id", redEnvelopeID).
			Int64("user_id", userID).
			Msg("User ID does not match owner of red envelope")
		return "", fmt.Errorf("user is not the owner of this red envelope")
	}

	ctx := context.Background()

	envelope, err := r.GetRedEnvelopeCloseSesssion(redEnvelopeID)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Msg("Failed to get total claimed amount")
		return "", err
	}

	if envelope.RemainingAmount > 0 {
		logger.Info().
			Str("red_envelope_id", redEnvelopeID).
			Int64("remaining_balance", envelope.RemainingAmount).
			Str("red_envelope_wallet", envelope.RedEnvelopeWallet).
			Str("owner_wallet", envelope.OwnerWallet).
			Msg("Transferring remaining balance back to owner")

		var wallet *models.IntermediaryWallet
		wallet, err = r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to get wallet")
		} else {
			// TODO: update pass amount from envelope
			amount := types.NewBigIntString(envelope.RemainingAmount).Multiply(constants.TokenMultiplierBigIntString)
			_, err := r.blockchainService.TransferMoney(wallet.EncryptedPrivateKey, envelope.RedEnvelopeWallet, envelope.OwnerWallet, amount.String(), constants.TextDataLuckyMoney, constants.ExtraInfoLuckyMoney)
			if err != nil {
				return envelope.RedEnvelopeWallet, err
			}
		}
	}

	_, err = r.UpdateRedEnvelope(ctx, redEnvelopeID, constants.RedEnvelopeStatusClosed, nil)
	if err != nil {
		logger.Error().
			Err(err).
			Str("red_envelope_id", redEnvelopeID).
			Msg("Failed to update status to CLOSED")
		return envelope.RedEnvelopeWallet, err
	}

	return envelope.RedEnvelopeWallet, nil
}

func (r *RedEnvelopeRepository) ExecuteClaim(id, claimerWallet string, claimerUserID, amount int64) error {
	// --- PHASE 1: RESERVATION (Transaction 1) ---
	// We reserve the slot and record the claim as 'PENDING' before calling Blockchain.
	// If this succeeds and commits, the user has "taken" a turn.
	var claimID int64
	var envelope struct {
		RedEnvelopeWallet string
	}

	err := func() error {
		tx, err := r.db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin reservation transaction: %w", err)
		}
		defer func() {
			if err != nil {
				_ = tx.Rollback()
			}
		}()

		envelopeQuery := fmt.Sprintf(`
			SELECT red_envelope_wallet, status, total_claims, claimed_count
			FROM %s.red_envelope
			WHERE id = $1
			FOR UPDATE
		`, r.dongSchema)

		var status string
		var totalClaims, claimedCount int64
		err = tx.QueryRow(envelopeQuery, id).Scan(
			&envelope.RedEnvelopeWallet,
			&status,
			&totalClaims,
			&claimedCount,
		)
		if err != nil {
			return fmt.Errorf("failed to get envelope for reservation: %w", err)
		}

		if status != constants.RedEnvelopeStatusPublished {
			return fmt.Errorf("red envelope is not published")
		}

		if claimedCount >= totalClaims {
			return fmt.Errorf("red envelope is fully claimed")
		}

		// Insert claim as PENDING
		claimQuery := fmt.Sprintf(`
			INSERT INTO %s.red_envelope_claim (
				red_envelope_id, claimer_wallet, claimer_user_id, 
				amount, status
			)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, r.dongSchema)

		err = tx.QueryRow(
			claimQuery,
			id,
			claimerWallet,
			claimerUserID,
			amount,
			constants.RedEnvelopeClaimStatusPending,
		).Scan(&claimID)
		if err != nil {
			return fmt.Errorf("failed to create pending claim record: %w", err)
		}

		// Increment claimed_count
		updateQuery := fmt.Sprintf(`
			UPDATE %s.red_envelope
			SET claimed_count = claimed_count + 1,
				updated_at = $1
			WHERE id = $2
		`, r.dongSchema)

		_, err = tx.Exec(updateQuery, time.Now(), id)
		if err != nil {
			return fmt.Errorf("failed to reserve claim slot: %w", err)
		}

		return tx.Commit()
	}()

	if err != nil {
		logger.Error().Err(err).Str("id", id).Int64("user_id", claimerUserID).Msg("Reservation failed")
		return err
	}

	// --- PHASE 2: TRANSFER ---
	ctx := context.Background()
	walletInfo, err := r.walletRepo.GetWalletByAddress(ctx, envelope.RedEnvelopeWallet)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get wallet info for blockchain transfer")
		_ = r.updateFinalClaimStatus(id, claimID, constants.RedEnvelopeClaimStatusFailed, nil, true)
		return fmt.Errorf("failed to get wallet info")
	}

	claimAmount := types.NewBigIntString(amount).Multiply(constants.TokenMultiplierBigIntString)
	extraInfo := fmt.Sprintf(constants.ExtraInfoLuckyMoneyClaim, claimID)

	txHash, err := r.blockchainService.TransferMoney(
		walletInfo.EncryptedPrivateKey,
		envelope.RedEnvelopeWallet,
		claimerWallet,
		claimAmount.String(),
		constants.TextDataLuckyMoney,
		extraInfo,
	)

	if err != nil {
		logger.Error().Err(err).
			Str("from", envelope.RedEnvelopeWallet).
			Str("to", claimerWallet).
			Int64("claim_id", claimID).
			Msg("Blockchain transfer failed")

		// Revert reservation because transfer failed
		_ = r.updateFinalClaimStatus(id, claimID, constants.RedEnvelopeClaimStatusFailed, nil, true)
		return fmt.Errorf("failed to transfer money")
	}

	// --- PHASE 3: FINAL STATUS UPDATE ---
	err = r.updateFinalClaimStatus(id, claimID, constants.RedEnvelopeClaimStatusSuccess, &txHash, false)
	if err != nil {
		// CRITICAL: Money IS transferred but DB update failed.
		// We return nil (Success) to the user because they actually received the money.
		// The record is already in 'PENDING', so the Indexer/Fallback job will reconcile it.
		logger.Error().Err(err).
			Int64("claim_id", claimID).
			Str("tx_hash", txHash).
			Msg("Money transferred but failed to update claim status to SUCCESS in DB. Reconcile via Indexer.")
		return nil
	}

	return nil
}

// updateFinalClaimStatus updates the claim result and optionally reverts the claimed_count (compensation)
func (r *RedEnvelopeRepository) updateFinalClaimStatus(envelopeID string, claimID int64, status string, txHash *string, shouldRevertCount bool) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// Update claim status
	query := fmt.Sprintf(`
		UPDATE %s.red_envelope_claim
		SET status = $1,
		    transaction_hash = $2
		WHERE id = $3
	`, r.dongSchema)

	_, err = tx.Exec(query, status, txHash, claimID)
	if err != nil {
		return err
	}

	// Compensation logic: if transfer failed, return the slot
	if shouldRevertCount {
		revertQuery := fmt.Sprintf(`
			UPDATE %s.red_envelope
			SET claimed_count = claimed_count - 1,
				updated_at = $1
			WHERE id = $2 AND claimed_count > 0
		`, r.dongSchema)
		_, err = tx.Exec(revertQuery, time.Now(), envelopeID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *RedEnvelopeRepository) HasUserClaimed(redEnvelopeID string, userID int64) (bool, error) {
	query := fmt.Sprintf(`
      SELECT COUNT(*)
      FROM %s.red_envelope_claim rec
      WHERE red_envelope_id = $1 AND claimer_user_id = $2
    `, r.dongSchema)
	var count int64
	err := r.db.QueryRow(query, redEnvelopeID, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to get claimed user id: %w", err)
	}
	return count == 0, nil
}

func (r *RedEnvelopeRepository) GetRedEnvelopeDescriptionByID(redEnvelopeID string) (string, error) {
	query := fmt.Sprintf(`
		SELECT description
		FROM %s.red_envelope
		WHERE id = $1
	`, r.dongSchema)
	var description string
	err := r.db.QueryRow(query, redEnvelopeID).Scan(&description)
	if err != nil {
		return "", fmt.Errorf("failed to get red envelope description by id: %w", err)
	}
	return description, nil
}

func (r *RedEnvelopeRepository) UpdateStatusInternal(ctx context.Context, id, status, txHash string) (*models.RedEnvelope, error) {
	query := fmt.Sprintf(`
		UPDATE %s.red_envelope
		SET status = $1, transaction_hash = $2, updated_at = $3
		WHERE id = $4 AND status = $5
		RETURNING id, name, description, total_amount, min_amount, max_amount, 
			   total_claims, claimed_count, red_envelope_wallet, owner_wallet, 
			   creator, status, transaction_hash, is_random_distribution, 
			   start_date, end_date, created_at, updated_at
	`, r.dongSchema)

	envelope := &models.RedEnvelope{}

	err := r.db.QueryRowContext(ctx, query, status, txHash, time.Now(), id, constants.RedEnvelopeStatusPending).Scan(
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
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("red envelope not found")
		}
		logger.Error().Err(err).Str("envelope_id", id).Msg("Scan error on RETURNING UpdateStatusInternal")
		return nil, fmt.Errorf("failed to update status and fetch envelope: %w", err)
	}

	return envelope, nil
}
