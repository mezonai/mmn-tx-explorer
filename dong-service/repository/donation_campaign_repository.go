package repository

import (
	"database/sql"
	"dong-service/constants"
	"dong-service/models"
	"fmt"
	"strings"
	"time"
)

// DonationCampaignRepository handles database operations for donation campaigns
type DonationCampaignRepository struct {
	db *sql.DB
}

// NewDonationCampaignRepository creates a new donation campaign repository
func NewDonationCampaignRepository(db *sql.DB) *DonationCampaignRepository {
	return &DonationCampaignRepository{db: db}
}

// Create creates a new donation campaign
func (r *DonationCampaignRepository) Create(campaign *models.CreateDonationCampaignRequest) (*models.DonationCampaign, error) {
	query := `
		INSERT INTO donation_campaign (name, description, goal, url, end_date, donation_wallet, creator, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, status, created_at, updated_at
	`

	var result models.DonationCampaign
	err := r.db.QueryRow(
		query,
		campaign.Name,
		campaign.Description,
		campaign.Goal,
		campaign.URL,
		campaign.EndDate,
		campaign.DonationWallet,
		campaign.Creator,
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
		&result.Status,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create donation campaign: %w", err)
	}

	return &result, nil
}

// GetByID retrieves a donation campaign by ID
func (r *DonationCampaignRepository) GetByID(id int64) (*models.DonationCampaign, error) {
	query := `
		SELECT id, name, description, goal, url, end_date, donation_wallet, creator, status, created_at, updated_at
		FROM donation_campaign
		WHERE id = $1
	`

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
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("donation campaign not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get donation campaign: %w", err)
	}

	return &campaign, nil
}

// GetAll retrieves all donation campaigns with pagination
func (r *DonationCampaignRepository) GetAll(limit, offset int, status *int16, order string) ([]models.DonationCampaign, error) {
	base := `
        SELECT id, name, description, goal, url, end_date, donation_wallet, creator, status, created_at, updated_at
        FROM donation_campaign`

	var (
		whereClauses []string
		args         []interface{}
		argCount     = 1
	)

	if status != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argCount))
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

	base += fmt.Sprintf("\nORDER BY created_at %s\nLIMIT $%d OFFSET $%d", orderBy, argCount, argCount+1)
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
			&campaign.Status,
			&campaign.CreatedAt,
			&campaign.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan donation campaign: %w", err)
		}
		campaigns = append(campaigns, campaign)
	}

	return campaigns, nil
}

// Update updates a donation campaign
func (r *DonationCampaignRepository) Update(id int64, req *models.UpdateDonationCampaignRequest) (*models.DonationCampaign, error) {
	// Build dynamic update query
	var setClauses []string
	var args []interface{}
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

	if len(setClauses) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Always update updated_at
	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())
	argCount++

	// Add ID to args
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE donation_campaign
		SET %s
		WHERE id = $%d
		RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, status, created_at, updated_at
	`, strings.Join(setClauses, ", "), argCount)

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
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("donation campaign not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update donation campaign: %w", err)
	}

	return &campaign, nil
}

// Activate sets a campaign status to Active
func (r *DonationCampaignRepository) Activate(id int64) (*models.DonationCampaign, error) {
	query := `
        UPDATE donation_campaign
        SET status = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, status, created_at, updated_at
    `

	var campaign models.DonationCampaign
	err := r.db.QueryRow(
		query,
		constants.CampaignStatusActive,
		time.Now(),
		id,
	).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("donation campaign not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to activate donation campaign: %w", err)
	}

	return &campaign, nil
}

// Close sets a campaign status to Closed
func (r *DonationCampaignRepository) Close(id int64) (*models.DonationCampaign, error) {
	query := `
		UPDATE donation_campaign
		SET status = $1, updated_at = $2
		WHERE id = $3
		RETURNING id, name, description, goal, url, end_date, donation_wallet, creator, status, created_at, updated_at
	`

	var campaign models.DonationCampaign
	err := r.db.QueryRow(
		query,
		constants.CampaignStatusClosed,
		time.Now(),
		id,
	).Scan(
		&campaign.ID,
		&campaign.Name,
		&campaign.Description,
		&campaign.Goal,
		&campaign.URL,
		&campaign.EndDate,
		&campaign.DonationWallet,
		&campaign.Creator,
		&campaign.Status,
		&campaign.CreatedAt,
		&campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("donation campaign not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to close donation campaign: %w", err)
	}

	return &campaign, nil
}

// Count returns the total number of campaigns
func (r *DonationCampaignRepository) Count(status *int16) (int64, error) {
	query := `SELECT COUNT(*) FROM donation_campaign`
	var (
		whereClauses []string
		args         []interface{}
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
