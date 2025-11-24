package repository

import (
	"database/sql"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/utils"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// Custom repository errors
var (
	ErrNotFound         = errors.New("donation campaign not found")
	ErrPermissionDenied = errors.New("donation campaign not found or you don't have permission")
	ErrNoFieldsToUpdate = errors.New("no fields to update")
)

// DonationCampaignRepository handles database operations for donation campaigns
type DonationCampaignRepository struct {
	db            *sql.DB
	dongSchema    string
	indexerSchema string
}

// NewDonationCampaignRepository creates a new donation campaign repository
func NewDonationCampaignRepository(db *sql.DB, dongSchema string, indexerSchema string) *DonationCampaignRepository {
	return &DonationCampaignRepository{db: db, dongSchema: dongSchema, indexerSchema: indexerSchema}
}

// Create creates a new donation campaign
func (r *DonationCampaignRepository) Create(campaign *models.CreateDonationCampaignRequest, creator int64) (*models.DonationCampaign, error) {
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

	baseSlug := utils.GenerateSlug(campaign.Name)
	uniqueSlug, slugErr := r.GenerateUniqueSlug(baseSlug)
	if slugErr != nil {
		return nil, slugErr
	}

	campaignQuery := fmt.Sprintf(`
        INSERT INTO %s.donation_campaign (name, slug, description, goal, url, end_date, donation_wallet, creator, owner, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, slug, description, goal, url, end_date, donation_wallet, creator, owner, verified, status, created_at, updated_at
    `, r.dongSchema)

	var result models.DonationCampaign
	err = tx.QueryRow(
		campaignQuery,
		campaign.Name,
		uniqueSlug,
		campaign.Description,
		campaign.Goal,
		campaign.URL,
		campaign.EndDate,
		campaign.DonationWallet,
		creator,
		campaign.Owner,
		constants.CampaignStatusDraft,
	).Scan(
		&result.ID,
		&result.Name,
		&result.Slug,
		&result.Description,
		&result.Goal,
		&result.URL,
		&result.EndDate,
		&result.DonationWallet,
		&result.Creator,
		&result.Owner,
		&result.Verified,
		&result.Status,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create donation campaign: %w", err)
	}

	// Insert campaign statistics
	statsQuery := fmt.Sprintf(`
		INSERT INTO %s.campaign_statistics (campaign_id, campaign_wallet, total_amount, total_contributor, total_withdrawn)
		VALUES ($1, $2, $3, $4, $5)
	`, r.dongSchema)

	_, err = tx.Exec(statsQuery, result.ID, result.DonationWallet, 0, 0, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to create campaign statistics: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &result, nil
}

// CreateAndActive creates a new donation campaign and immediately activates it
func (r *DonationCampaignRepository) CreateAndActive(campaign *models.CreateDonationCampaignRequest, creator int64) (*models.DonationCampaign, error) {
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

	baseSlug := utils.GenerateSlug(campaign.Name)
	uniqueSlug, slugErr := r.GenerateUniqueSlug(baseSlug)

	if slugErr != nil {
		return nil, slugErr
	}

	campaignQuery := fmt.Sprintf(`
        INSERT INTO %s.donation_campaign (name, slug, description, goal, url, end_date, donation_wallet, creator, owner, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, slug, description, goal, url, end_date, donation_wallet, creator, owner, verified, status, created_at, updated_at
    `, r.dongSchema)

	var result models.DonationCampaign

	err = tx.QueryRow(
		campaignQuery,
		campaign.Name,
		uniqueSlug,
		campaign.Description,
		campaign.Goal,
		campaign.URL,
		campaign.EndDate,
		campaign.DonationWallet,
		creator,
		campaign.Owner,
		constants.CampaignStatusActive, // Set status to Active instead of Draft
	).Scan(
		&result.ID,
		&result.Name,
		&result.Slug,
		&result.Description,
		&result.Goal,
		&result.URL,
		&result.EndDate,
		&result.DonationWallet,
		&result.Creator,
		&result.Owner,
		&result.Verified,
		&result.Status,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create donation campaign: %w", err)
	}

	// Insert campaign statistics
	statsQuery := fmt.Sprintf(`
		INSERT INTO %s.campaign_statistics (campaign_id, campaign_wallet, total_amount, total_contributor, total_withdrawn)
		VALUES ($1, $2, $3, $4, $5)
	`, r.dongSchema)

	_, err = tx.Exec(statsQuery, result.ID, result.DonationWallet, 0, 0, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to create campaign statistics: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &result, nil
}

// GetByID retrieves a donation campaign by ID
func (r *DonationCampaignRepository) GetByID(id int64) (*models.DonationCampaign, error) {
	query := fmt.Sprintf(`
		SELECT 
            dc.id, dc.name, dc.slug, dc.description, dc.goal, dc.url, dc.end_date, dc.donation_wallet, dc.creator, dc.owner, dc.verified, dc.status, dc.created_at, dc.updated_at,
			cs.total_amount, cs.total_contributor,
			COALESCE(w.balance, '0') as current_balance,
			cs.total_withdrawn
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		LEFT JOIN %s.wallet w ON w.address = dc.donation_wallet
		WHERE dc.id = $1
	`, r.dongSchema, r.dongSchema, r.indexerSchema)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(query, id).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Slug,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Verified,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
		&campaign.TotalAmount,
		&campaign.TotalContributors,
		&campaign.CurrentBalance,
		&campaign.TotalWithdrawn,
	)

	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get donation campaign: %w", err)
	}

	return &campaign, nil
}

// GetByIDAndCreator retrieves a donation campaign by ID and creator
func (r *DonationCampaignRepository) GetByIDAndCreator(id int64, creator int64) (*models.DonationCampaign, error) {
	query := fmt.Sprintf(`
		SELECT 
            dc.id, dc.name, dc.slug, dc.description, dc.goal, dc.url, dc.end_date, dc.donation_wallet, dc.creator, dc.owner, dc.verified, dc.status, dc.created_at, dc.updated_at,
			cs.total_amount, cs.total_contributor,
			COALESCE(w.balance, '0') as current_balance,
			cs.total_withdrawn
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		LEFT JOIN %s.wallet w ON w.address = dc.donation_wallet
		WHERE dc.id = $1 AND dc.creator = $2
	`, r.dongSchema, r.dongSchema, r.indexerSchema)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(query, id, creator).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Slug,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Verified,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
		&campaign.TotalAmount,
		&campaign.TotalContributors,
		&campaign.CurrentBalance,
		&campaign.TotalWithdrawn,
	)

	if err == sql.ErrNoRows {
		return nil, ErrPermissionDenied
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get donation campaign: %w", err)
	}

	return &campaign, nil
}

// GetAll retrieves all donation campaigns with pagination
func (r *DonationCampaignRepository) GetAll(status *int16, pagination utils.PaginationParams) ([]models.DonationCampaign, error) {
	base := fmt.Sprintf(`
        SELECT 
            dc.id, dc.name, dc.slug, dc.description, dc.goal, dc.url, dc.end_date, dc.donation_wallet, dc.creator, dc.owner, dc.verified, dc.status, dc.created_at, dc.updated_at,
			cs.total_amount, cs.total_contributor
        FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
	`, r.dongSchema, r.dongSchema)

	var (
		whereClauses []string
		args         []any
		argCount     = 1
	)

	if status != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("dc.status = $%d", argCount))
		args = append(args, *status)
		argCount++
	}

	if len(whereClauses) > 0 {
		base += "\nWHERE " + strings.Join(whereClauses, " AND ")
	}

	orderDir := "DESC"
	if strings.EqualFold(pagination.Order, "asc") {
		orderDir = "ASC"
	}

	// Whitelist allowed order_by columns to prevent SQL injection
	var orderByExpr string
	switch strings.ToLower(pagination.OrderBy) {
	case "created_at":
		orderByExpr = "dc.created_at"
	case "total_amount":
		orderByExpr = "cs.total_amount"
	default:
		orderByExpr = "dc.created_at"
	}

	base += fmt.Sprintf("\nORDER BY %s %s\nLIMIT $%d OFFSET $%d", orderByExpr, orderDir, argCount, argCount+1)
	args = append(args, pagination.Limit, pagination.Offset)

	rows, err := r.db.Query(base, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get donation campaigns: %w", err)
	}
	defer func() {
		if err != nil {
			errClose := rows.Close()
			if errClose != nil {
				logger.Error().Err(errClose).Msg("Failed to close rows")
			}
		}
	}()

	var campaigns []models.DonationCampaign
	for rows.Next() {
		var campaign models.DonationCampaign
		err := rows.Scan(
			&campaign.ID,
			&campaign.Name,
			&campaign.Slug,
			&campaign.Description,
			&campaign.Goal,
			&campaign.URL,
			&campaign.EndDate,
			&campaign.DonationWallet,
			&campaign.Creator,
			&campaign.Owner,
			&campaign.Verified,
			&campaign.Status,
			&campaign.CreatedAt,
			&campaign.UpdatedAt,
			&campaign.TotalAmount,
			&campaign.TotalContributors,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan donation campaign: %w", err)
		}
		campaigns = append(campaigns, campaign)
	}

	return campaigns, nil
}

// Update updates a donation campaign
func (r *DonationCampaignRepository) Update(id int64, creator int64, req *models.UpdateDonationCampaignRequest) (*models.DonationCampaign, error) {
	// Build dynamic update query
	var setClauses []string
	var args []any
	argCount := 1

	if req.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argCount))
		args = append(args, *req.Description)
		argCount++
	}
	if req.Goal != nil {
		setClauses = append(setClauses, fmt.Sprintf("goal = $%d", argCount))
		args = append(args, *req.Goal)
		argCount++
	}
	if req.URL != nil {
		setClauses = append(setClauses, fmt.Sprintf("url = $%d", argCount))
		args = append(args, *req.URL)
		argCount++
	}
	if req.EndDate != nil {
		setClauses = append(setClauses, fmt.Sprintf("end_date = $%d", argCount))
		args = append(args, *req.EndDate)
		argCount++
	}

	if len(setClauses) == 0 {
		return nil, ErrNoFieldsToUpdate
	}

	// Always update updated_at
	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())
	argCount++

	// Add ID and creator to args for WHERE clause
	args = append(args, id)
	idArgNum := argCount
	argCount++
	args = append(args, creator)
	creatorArgNum := argCount

	query := fmt.Sprintf(`
		UPDATE %s.donation_campaign
		SET %s
		WHERE id = $%d AND creator = $%d
        RETURNING id, name, slug, description, goal, url, end_date, donation_wallet, creator, owner, verified, status, created_at, updated_at
	`, r.dongSchema, strings.Join(setClauses, ", "), idArgNum, creatorArgNum)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(query, args...).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Slug,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Verified,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrPermissionDenied
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update donation campaign: %w", err)
	}

	return &campaign, nil
}

// Activate sets a campaign status to Active
func (r *DonationCampaignRepository) Activate(id int64, creator int64) (*models.DonationCampaign, error) {
	query := fmt.Sprintf(`
        UPDATE %s.donation_campaign
        SET status = $1, updated_at = $2
        WHERE id = $3 AND creator = $4
        RETURNING id, name, slug, description, goal, url, end_date, donation_wallet, creator, owner, verified, status, created_at, updated_at
    `, r.dongSchema)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(
		query,
		constants.CampaignStatusActive,
		time.Now(),
		id,
		creator,
	).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Slug,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Verified,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrPermissionDenied
	}
	if err != nil {
		return nil, fmt.Errorf("failed to activate donation campaign: %w", err)
	}

	return &campaign, nil
}

// Close sets a campaign status to Closed
func (r *DonationCampaignRepository) Close(id int64, creator int64) (*models.DonationCampaign, error) {
	query := fmt.Sprintf(`
		UPDATE %s.donation_campaign
		SET status = $1, updated_at = $2
		WHERE id = $3 AND creator = $4
        RETURNING id, name, slug, description, goal, url, end_date, donation_wallet, creator, owner, verified, status, created_at, updated_at
	`, r.dongSchema)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(
		query,
		constants.CampaignStatusClosed,
		time.Now(),
		id,
		creator,
	).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Slug,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Verified,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrPermissionDenied
	}
	if err != nil {
		return nil, fmt.Errorf("failed to close donation campaign: %w", err)
	}

	return &campaign, nil
}

// Count returns the total number of campaigns
func (r *DonationCampaignRepository) Count(status *int16) (int64, error) {
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s.donation_campaign`, r.dongSchema)
	var (
		whereClauses []string
		args         []any
	)

	if status != nil {
		whereClauses = append(whereClauses, "status = $1")
		args = append(args, *status)
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	var count int64
	err := r.db.QueryRow(query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count campaigns: %w", err)
	}

	return count, nil
}

// GetTopContributors returns top contributors for a specific campaign
func (r *DonationCampaignRepository) GetTopContributors(campaignID int64, limit int) (*models.TopContributorsResponse, error) {
	// Single optimized query with JOIN
	query := fmt.Sprintf(`
		SELECT 
			cc.sender_wallet, 
			cc.total_donate,
			cs.total_amount
		FROM %s.campaign_contributor cc
		JOIN %s.donation_campaign dc ON cc.campaign_wallet = dc.donation_wallet
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		WHERE dc.id = $1
		ORDER BY cc.total_donate DESC
		LIMIT $2
	`, r.dongSchema, r.dongSchema, r.dongSchema)

	rows, err := r.db.Query(query, campaignID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get top contributors: %w", err)
	}
	defer func() {
		if err != nil {
			errClose := rows.Close()
			if errClose != nil {
				logger.Error().Err(errClose).Msg("Failed to close rows")
			}
		}
	}()

	var contributors []models.TopContributor
	var campaignTotalAmount int64
	var hasData bool

	for rows.Next() {
		var contributor models.TopContributor

		err := rows.Scan(&contributor.SenderWallet, &contributor.TotalDonate, &campaignTotalAmount)
		if err != nil {
			return nil, fmt.Errorf("failed to scan contributor: %w", err)
		}

		// Calculate percentage of total campaign amount
		if campaignTotalAmount > 0 {
			contributor.Percentage = float64(contributor.TotalDonate) / float64(campaignTotalAmount) * 100
		} else {
			contributor.Percentage = 0
		}

		contributors = append(contributors, contributor)
		hasData = true
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate contributors: %w", err)
	}

	// If no data found, campaign doesn't exist
	if !hasData {
		return &models.TopContributorsResponse{
			CampaignID:   campaignID,
			Contributors: []models.TopContributor{},
		}, nil
	}

	return &models.TopContributorsResponse{
		CampaignID:   campaignID,
		Contributors: contributors,
	}, nil
}

// Delete removes a drafted donation campaign by ID if the requester is the creator
func (r *DonationCampaignRepository) DeleteDraft(id int64, creator int64) error {
	query := fmt.Sprintf(`
		DELETE FROM %s.donation_campaign
		WHERE id = $1 AND creator = $2
	`, r.dongSchema)

	res, err := r.db.Exec(query, id, creator)
	if err != nil {
		return fmt.Errorf("failed to delete donation campaign: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to determine delete result: %w", err)
	}
	if affected == 0 {
		return ErrPermissionDenied
	}

	return nil
}
func (r *DonationCampaignRepository) CheckSlugExists(slug string) (bool, error) {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.donation_campaign WHERE slug = $1", r.dongSchema)
	err := r.db.QueryRow(query, slug).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check slug existence: %w", err)
	}
	return count > 0, nil
}

func (r *DonationCampaignRepository) GenerateUniqueSlug(baseSlug string) (string, error) {
	exists, err := r.CheckSlugExists(baseSlug)
	if err != nil {
		return "", err
	}

	if !exists {
		return baseSlug, nil
	}

	query := fmt.Sprintf(`
		SELECT slug 
		FROM %s.donation_campaign 
		WHERE slug = $1 OR slug ~ $2
		ORDER BY slug
	`, r.dongSchema)

	pattern := fmt.Sprintf("^%s-[0-9]+$", regexp.QuoteMeta(baseSlug))

	rows, err := r.db.Query(query, baseSlug, pattern)
	if err != nil {
		return "", fmt.Errorf("failed to query existing slugs: %w", err)
	}
	defer rows.Close()

	maxIndex := 0

	for rows.Next() {
		var existingSlug string
		if err := rows.Scan(&existingSlug); err != nil {
			return "", fmt.Errorf("failed to scan slug: %w", err)
		}

		if existingSlug == baseSlug {
			continue
		}

		suffix := strings.TrimPrefix(existingSlug, baseSlug+"-")
		if index, err := strconv.Atoi(suffix); err == nil {
			if index > maxIndex {
				maxIndex = index
			}
		}
	}

	nextIndex := maxIndex + 1

	return fmt.Sprintf("%s-%d", baseSlug, nextIndex), nil
}

func (r *DonationCampaignRepository) GetBySlug(slug string) (*models.DonationCampaign, error) {
	query := fmt.Sprintf(`
		SELECT 
            dc.id, dc.name, dc.slug, dc.description, dc.goal, dc.url, dc.end_date, dc.donation_wallet, dc.creator, dc.owner, dc.verified, dc.status, dc.created_at, dc.updated_at,
			cs.total_amount, cs.total_contributor,
			COALESCE(w.balance, '0') as current_balance,
			cs.total_withdrawn
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		LEFT JOIN %s.wallet w ON w.address = dc.donation_wallet
		WHERE dc.slug = $1
	`, r.dongSchema, r.dongSchema, r.indexerSchema)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(query, slug).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Slug,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Verified,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
		&campaign.TotalAmount,
		&campaign.TotalContributors,
		&campaign.CurrentBalance,
		&campaign.TotalWithdrawn,
	)

	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get donation campaign by slug: %w", err)
	}

	return &campaign, nil
}

// IsCampaignWallet checks if a wallet address is associated with any campaign
func (r *DonationCampaignRepository) IsCampaignWallet(address string) (bool, error) {
	query := fmt.Sprintf(`
		SELECT EXISTS(
			SELECT 1 FROM %s.donation_campaign 
			WHERE donation_wallet = $1
		)
	`, r.dongSchema)

	var exists bool
	err := r.db.QueryRow(query, address).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if wallet is campaign wallet: %w", err)
	}

	return exists, nil
}
