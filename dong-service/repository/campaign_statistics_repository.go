package repository

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"fmt"
	"time"
)

// CampaignStatisticsRepository handles database operations for campaign statistics
type CampaignStatisticsRepository struct {
	db               *sql.DB
	indexerSchema    string
	dongSchema       string
	recentWindowDays int
}

// NewCampaignStatisticsRepository creates a new campaign statistics repository
func NewCampaignStatisticsRepository(db *sql.DB, indexerSchema, dongSchema string, recentWindowDays int) *CampaignStatisticsRepository {
	return &CampaignStatisticsRepository{
		db:               db,
		indexerSchema:    indexerSchema,
		dongSchema:       dongSchema,
		recentWindowDays: recentWindowDays,
	}
}

// Campaign represents a donation campaign
type Campaign struct {
	ID               int64
	DonationWallet   string
	UpdatedAt        time.Time
	TotalAmount      int64
	TotalContributor int64
	TotalWithdrawn   int64
}

// GetActiveCampaigns retrieves all active donation campaigns
func (r *CampaignStatisticsRepository) GetActiveCampaigns(ctx context.Context) ([]Campaign, error) {
	// Build query with parameter placeholders for statuses (campaign and transaction)
	// and cast aggregates to BIGINT to avoid type issues when assigning to
	// BIGINT columns like recent_amount and total_withdrawn.
	query := fmt.Sprintf(`
		SELECT id, donation_wallet
		FROM %s.donation_campaign
		WHERE status = $1
	`, r.dongSchema)

	rows, err := r.db.QueryContext(ctx, query, constants.CampaignStatusActive)
	if err != nil {
		return nil, fmt.Errorf("failed to query campaigns: %w", err)
	}
	defer func() {
		if err != nil {
			errClose := rows.Close()
			if errClose != nil {
				logger.Error().Err(errClose).Msg("Failed to close rows")
			}
		}
	}()

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

	result, err := r.db.ExecContext(ctx, query, campaign.DonationWallet, constants.TransactionStatusFINALIZED)
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
func (r *CampaignStatisticsRepository) UpdateCampaignStatistics(ctx context.Context, days int) (int64, error) {
	// Using INNER JOIN to only update campaigns that have contributors
	// This is more performant and focuses on campaigns with activity
	// We calculate total_withdrawn by summing outgoing transactions from the campaign wallet
	query := fmt.Sprintf(`
		UPDATE %s.campaign_statistics cs
		SET 
			total_amount = cc_stats.total_amount,
			total_contributor = cc_stats.contributor_count,
			total_withdrawn = cc_stats.total_withdrawn,
			recent_amount = COALESCE(recent_stats.recent_amount, 0),
			updated_at = NOW()
		FROM %s.donation_campaign dc
		INNER JOIN (
			SELECT 
				cc.campaign_wallet,
				SUM(cc.total_donate)::BIGINT as total_amount,
				COUNT(DISTINCT cc.sender_wallet) as contributor_count,
				COALESCE((
					SELECT SUM(value)
					FROM %s.transactions
					WHERE from_address = cc.campaign_wallet
					AND status = $2
				), 0)::BIGINT as total_withdrawn
			FROM %s.campaign_contributor cc
			GROUP BY cc.campaign_wallet
		) cc_stats ON dc.donation_wallet = cc_stats.campaign_wallet
		LEFT JOIN (
			SELECT 
				to_address as campaign_wallet,
				SUM(value)::BIGINT as recent_amount
				FROM %s.transactions
			WHERE status = $2
				AND value > 0
				AND transaction_timestamp >= NOW() - INTERVAL '%d days'
			GROUP BY to_address
		) recent_stats ON dc.donation_wallet = recent_stats.campaign_wallet
		WHERE cs.campaign_wallet = dc.donation_wallet
		AND dc.status = $1
	`, r.dongSchema, r.dongSchema, r.indexerSchema, r.dongSchema, r.indexerSchema, days)

	// Pass campaign status and transaction status as parameters to avoid
	// format-time substitution issues and protect against SQL errors.
	result, err := r.db.ExecContext(ctx, query, constants.CampaignStatusActive, constants.TransactionStatusFINALIZED)
	if err != nil {
		return 0, fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
}

// SyncCampaignByID syncs contributors and statistics for a specific campaign by ID
func (r *CampaignStatisticsRepository) SyncCampaignByID(ctx context.Context, campaignID int64) (models.SyncCampaignResponse, error) {
	// Get the campaign details
	campaignQuery := fmt.Sprintf(`
		SELECT dc.id, dc.donation_wallet, cs.updated_at, cs.total_amount, cs.total_contributor, cs.total_withdrawn
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		WHERE dc.id = $1
	`, r.dongSchema, r.dongSchema)

	var campaign Campaign
	err := r.db.QueryRowContext(ctx, campaignQuery, campaignID).Scan(&campaign.ID, &campaign.DonationWallet, &campaign.UpdatedAt, &campaign.TotalAmount, &campaign.TotalContributor, &campaign.TotalWithdrawn)
	if err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0, TotalWithdrawn: 0}, fmt.Errorf("failed to get campaign: %w", err)
	}

	// If statistics are already newer than the latest finalized transaction for this wallet, skip sync
	earlyCheckQuery := fmt.Sprintf(`
		SELECT MAX(transaction_timestamp) AS last_ts
		FROM %s.transactions
		WHERE (to_address = $1 OR from_address = $1)
			AND status = $2
			AND value > 0
			AND transaction_timestamp > $3
	`, r.indexerSchema)

	var lastTS sql.NullTime
	err = r.db.QueryRowContext(ctx, earlyCheckQuery, campaign.DonationWallet, constants.TransactionStatusFINALIZED, campaign.UpdatedAt).Scan(&lastTS)
	if err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0, TotalWithdrawn: 0}, fmt.Errorf("failed to check latest transaction vs stats: %w", err)
	}

	if !lastTS.Valid || lastTS.Time.IsZero() {
		currentBalance := campaign.TotalAmount - campaign.TotalWithdrawn
		logger.Info().Int64("campaign_id", campaignID).Time("updated_at", campaign.UpdatedAt).Time("last_ts", lastTS.Time).Msg("Campaign statistics are already up to date")
		return models.SyncCampaignResponse{TotalAmount: campaign.TotalAmount, TotalContributors: campaign.TotalContributor, CurrentBalance: currentBalance, TotalWithdrawn: campaign.TotalWithdrawn}, nil
	}

	// Sync contributors for this campaign
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

	_, err = r.db.ExecContext(ctx, query, campaign.DonationWallet, constants.TransactionStatusFINALIZED)
	if err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0, TotalWithdrawn: 0}, fmt.Errorf("failed to sync contributors: %w", err)
	}

	recentAmountQuery := fmt.Sprintf(`
		SELECT COALESCE(SUM(value), 0)
		FROM %s.transactions
		WHERE to_address = $1
		AND status = $2
		AND value > 0
		AND transaction_timestamp >= NOW() - INTERVAL '%d days'
	`, r.indexerSchema, r.recentWindowDays)

	var recentAmount int64
	err = r.db.QueryRowContext(ctx, recentAmountQuery, campaign.DonationWallet, constants.TransactionStatusFINALIZED).Scan(&recentAmount)
	if err != nil {
		recentAmount = 0 // fallback
	}

	updateStatsQuery := fmt.Sprintf(`
		UPDATE %s.campaign_statistics cs
		SET 
			total_amount = cc_stats.total_amount,
			total_contributor = cc_stats.contributor_count,
			total_withdrawn = cc_stats.total_withdrawn,
			recent_amount = $3,
			updated_at = NOW()
		FROM %s.donation_campaign dc
		INNER JOIN (
			SELECT 
				cc.campaign_wallet,
				SUM(cc.total_donate)::BIGINT as total_amount,
				COUNT(DISTINCT cc.sender_wallet) as contributor_count,
				COALESCE((
					SELECT SUM(value)
					FROM %s.transactions
					WHERE from_address = cc.campaign_wallet
					AND status = $4
				), 0)::BIGINT as total_withdrawn
			FROM %s.campaign_contributor cc
			WHERE cc.campaign_wallet = $1
			GROUP BY cc.campaign_wallet
		) cc_stats ON dc.donation_wallet = cc_stats.campaign_wallet
		WHERE cs.campaign_wallet = dc.donation_wallet
		AND dc.id = $2
		RETURNING cs.total_amount, cs.total_contributor, (cs.total_amount - cs.total_withdrawn) as current_balance, cs.total_withdrawn, cs.recent_amount
	`, r.dongSchema, r.dongSchema, r.indexerSchema, r.dongSchema)

	var updatedTotalAmount int64
	var updatedTotalContributor int64
	var updatedCurrentBalance int64
	var updatedTotalWithdrawn int64
	var updatedRecentAmount int64
	if err := r.db.QueryRowContext(ctx, updateStatsQuery, campaign.DonationWallet, campaignID, recentAmount, constants.TransactionStatusFINALIZED).Scan(&updatedTotalAmount, &updatedTotalContributor, &updatedCurrentBalance, &updatedTotalWithdrawn, &updatedRecentAmount); err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0, CurrentBalance: 0, TotalWithdrawn: 0, RecentAmount: 0}, fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	return models.SyncCampaignResponse{TotalAmount: updatedTotalAmount, TotalContributors: updatedTotalContributor, CurrentBalance: updatedCurrentBalance, TotalWithdrawn: updatedTotalWithdrawn, RecentAmount: updatedRecentAmount}, nil
}

// GetStats returns campaign statistics
func (r *CampaignStatisticsRepository) GetStats() (*models.CampaignStatsResponse, error) {
	query := fmt.Sprintf(`
		SELECT 
			COUNT(CASE WHEN dc.status = $1 THEN 1 END) as total_campaigns_active,
			COALESCE(SUM(cs.total_amount), 0) as total_amount,
			COALESCE(SUM(cs.total_contributor), 0) as total_contributors
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
	`, r.dongSchema, r.dongSchema)

	var stats models.CampaignStatsResponse
	err := r.db.QueryRow(query, constants.CampaignStatusActive).Scan(
		&stats.TotalCampaignsActive,
		&stats.TotalAmount,
		&stats.TotalContributors,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get campaign stats: %w", err)
	}

	return &stats, nil
}
