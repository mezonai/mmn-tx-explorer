package repository

import (
	"database/sql"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"errors"
	"fmt"
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
	db         *sql.DB
	dongSchema string
}

// NewDonationCampaignRepository creates a new donation campaign repository
func NewDonationCampaignRepository(db *sql.DB, dongSchema string) *DonationCampaignRepository {
	return &DonationCampaignRepository{db: db, dongSchema: dongSchema}
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

	// Insert donation campaign
	campaignQuery := fmt.Sprintf(`
		INSERT INTO %s.donation_campaign (name, description, goal, url, end_date, donation_wallet, creator, owner, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, owner, status, created_at, updated_at
	`, r.dongSchema)

	var result models.DonationCampaign
	err = tx.QueryRow(
		campaignQuery,
		campaign.Name,
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
		&result.Description,
		&result.Goal,
		&result.URL,
		&result.EndDate,
		&result.DonationWallet,
		&result.Creator,
		&result.Owner,
		&result.Status,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create donation campaign: %w", err)
	}

	// Insert campaign statistics
	statsQuery := fmt.Sprintf(`
		INSERT INTO %s.campaign_statistics (campaign_id, campaign_wallet, total_amount, total_contributor)
		VALUES ($1, $2, $3, $4)
	`, r.dongSchema)

	_, err = tx.Exec(statsQuery, result.ID, result.DonationWallet, 0, 0)
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

	// Insert donation campaign with Active status
	campaignQuery := fmt.Sprintf(`
		INSERT INTO %s.donation_campaign (name, description, goal, url, end_date, donation_wallet, creator, owner, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, owner, status, created_at, updated_at
	`, r.dongSchema)

	var result models.DonationCampaign
	err = tx.QueryRow(
		campaignQuery,
		campaign.Name,
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
		&result.Description,
		&result.Goal,
		&result.URL,
		&result.EndDate,
		&result.DonationWallet,
		&result.Creator,
		&result.Owner,
		&result.Status,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create donation campaign: %w", err)
	}

	// Insert campaign statistics
	statsQuery := fmt.Sprintf(`
		INSERT INTO %s.campaign_statistics (campaign_id, campaign_wallet, total_amount, total_contributor)
		VALUES ($1, $2, $3, $4)
	`, r.dongSchema)

	_, err = tx.Exec(statsQuery, result.ID, result.DonationWallet, 0, 0)
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
			dc.id, dc.name, dc.description, dc.goal, dc.url, dc.end_date, dc.donation_wallet, dc.creator, dc.owner, dc.status, dc.created_at, dc.updated_at,
			cs.total_amount, cs.total_contributor
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		WHERE dc.id = $1
	`, r.dongSchema, r.dongSchema)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(query, id).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
		&campaign.TotalAmount,
		&campaign.TotalContributors,
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
			dc.id, dc.name, dc.description, dc.goal, dc.url, dc.end_date, dc.donation_wallet, dc.creator, dc.owner, dc.status, dc.created_at, dc.updated_at,
			cs.total_amount, cs.total_contributor
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		WHERE dc.id = $1 AND dc.creator = $2
	`, r.dongSchema, r.dongSchema)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(query, id, creator).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
		&campaign.TotalAmount,
		&campaign.TotalContributors,
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
func (r *DonationCampaignRepository) GetAll(limit, offset int, status *int16, order string) ([]models.DonationCampaign, error) {
	base := fmt.Sprintf(`
        SELECT 
			dc.id, dc.name, dc.description, dc.goal, dc.url, dc.end_date, dc.donation_wallet, dc.creator, dc.owner, dc.status, dc.created_at, dc.updated_at,
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

	orderBy := "DESC"
	if strings.EqualFold(order, "asc") {
		orderBy = "ASC"
	}

	base += fmt.Sprintf("\nORDER BY dc.created_at %s\nLIMIT $%d OFFSET $%d", orderBy, argCount, argCount+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(base, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get donation campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []models.DonationCampaign
	for rows.Next() {
		var campaign models.DonationCampaign
		err := rows.Scan(
			&campaign.ID,
			&campaign.Name,
			&campaign.Description,
			&campaign.Goal,
			&campaign.URL,
			&campaign.EndDate,
			&campaign.DonationWallet,
			&campaign.Creator,
			&campaign.Owner,
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

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argCount))
		args = append(args, *req.Name)
		argCount++
	}
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
	if req.Owner != nil {
		setClauses = append(setClauses, fmt.Sprintf("owner = $%d", argCount))
		args = append(args, *req.Owner)
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
		RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, owner, status, created_at, updated_at
	`, r.dongSchema, strings.Join(setClauses, ", "), idArgNum, creatorArgNum)

	var campaign models.DonationCampaign
	err := r.db.QueryRow(query, args...).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
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
        RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, owner, status, created_at, updated_at
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
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
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
		RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, owner, status, created_at, updated_at
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
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Owner,
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
	defer rows.Close()

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
		return nil, ErrNotFound
	}

	return &models.TopContributorsResponse{
		CampaignID:   campaignID,
		Contributors: contributors,
	}, nil
}
