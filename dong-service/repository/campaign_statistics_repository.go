package repository

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"fmt"
)

// CampaignStatisticsRepository handles database operations for campaign statistics
type CampaignStatisticsRepository struct {
	db            *sql.DB
	indexerSchema string
	dongSchema    string
}

// NewCampaignStatisticsRepository creates a new campaign statistics repository
func NewCampaignStatisticsRepository(db *sql.DB, indexerSchema, dongSchema string) *CampaignStatisticsRepository {
	return &CampaignStatisticsRepository{
		db:            db,
		indexerSchema: indexerSchema,
		dongSchema:    dongSchema,
	}
}

// Campaign represents a donation campaign
type Campaign struct {
	ID             int64
	DonationWallet string
}

// GetActiveCampaigns retrieves all active donation campaigns
func (r *CampaignStatisticsRepository) GetActiveCampaigns(ctx context.Context) ([]Campaign, error) {
	query := fmt.Sprintf(`
		SELECT id, donation_wallet
		FROM %s.donation_campaign
		WHERE status = $1
	`, r.dongSchema)

	rows, err := r.db.QueryContext(ctx, query, constants.CampaignStatusActive)
	if err != nil {
		return nil, fmt.Errorf("failed to query campaigns: %w", err)
	}
	defer rows.Close()

	campaigns := make([]Campaign, 0)
	for rows.Next() {
		var campaign Campaign
		if err := rows.Scan(&campaign.ID, &campaign.DonationWallet); err != nil {
			return nil, fmt.Errorf("failed to scan campaign: %w", err)
		}
		campaigns = append(campaigns, campaign)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating campaigns: %w", err)
	}

	return campaigns, nil
}

// SyncCampaignTransactions syncs transactions for a specific campaign
func (r *CampaignStatisticsRepository) SyncCampaignTransactions(ctx context.Context, campaign Campaign) (processed, inserted, updated int, err error) {
	const TransactionStatus_FINALIZED = 2

	// Use a single query to upsert all contributors at once
	query := fmt.Sprintf(`
		INSERT INTO %s.campaign_contributor 
			(sender_wallet, campaign_wallet, total_donate)
		SELECT 
			from_address,
			to_address,
			SUM(value)
		FROM %s.transactions
		WHERE to_address = $1
			AND status = $2
			AND value > 0
		GROUP BY from_address, to_address
		ON CONFLICT (sender_wallet, campaign_wallet)
		DO UPDATE SET
			total_donate = EXCLUDED.total_donate,
			updated_at = NOW()
	`, r.dongSchema, r.indexerSchema)

	result, err := r.db.ExecContext(ctx, query, campaign.DonationWallet, TransactionStatus_FINALIZED)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to upsert contributors: %w", err)
	}

	// Get the number of affected rows
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	// Since we can't distinguish between inserts and updates in a single query,
	// we'll count all as processed. For more accurate tracking, we could use
	// a separate query to count new vs existing contributors.
	processed = int(rowsAffected)
	inserted = 0 // Cannot determine from single query
	updated = 0  // Cannot determine from single query

	return processed, inserted, updated, nil
}

// UpdateCampaignStatistics updates statistics in separate table to avoid locking issues
func (r *CampaignStatisticsRepository) UpdateCampaignStatistics(ctx context.Context) (int64, error) {
	// Using INNER JOIN to only update campaigns that have contributors
	// This is more performant and focuses on campaigns with activity
	query := fmt.Sprintf(`
		UPDATE %s.campaign_statistics cs
		SET 
			total_amount = cc_stats.total_amount,
			total_contributor = cc_stats.contributor_count,
			updated_at = NOW()
		FROM %s.donation_campaign dc
		INNER JOIN (
			SELECT 
				campaign_wallet,
				SUM(total_donate) as total_amount,
				COUNT(DISTINCT sender_wallet) as contributor_count
			FROM %s.campaign_contributor
			GROUP BY campaign_wallet
		) cc_stats ON dc.donation_wallet = cc_stats.campaign_wallet
		WHERE cs.campaign_wallet = dc.donation_wallet
		AND dc.status = $1
	`, r.dongSchema, r.dongSchema, r.dongSchema)

	result, err := r.db.ExecContext(ctx, query, constants.CampaignStatusActive)
	if err != nil {
		return 0, fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
}
