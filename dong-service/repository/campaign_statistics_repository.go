package repository

import (
	"context"
	"database/sql"
	"dong-service/config"
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
				campaign_wallet,
				SUM(total_donate) as total_amount,
				COUNT(DISTINCT sender_wallet) as contributor_count,
				SUM(total_donate) - COALESCE(w.balance, 0) AS total_withdrawn
			FROM %s.campaign_contributor cc
			LEFT JOIN %s.wallet w ON w.address = cc.campaign_wallet
			GROUP BY campaign_wallet, w.balance
		) cc_stats ON dc.donation_wallet = cc_stats.campaign_wallet
		LEFT JOIN (
			SELECT 
				to_address as campaign_wallet,
				SUM(value) as recent_amount
			FROM %s.transactions
			WHERE status = '%s'
				AND value > 0
				AND transaction_timestamp >= NOW() - INTERVAL '%d days'
			GROUP BY to_address
		) recent_stats ON dc.donation_wallet = recent_stats.campaign_wallet
		WHERE cs.campaign_wallet = dc.donation_wallet
		AND dc.status = $1
	`, r.dongSchema, r.dongSchema, r.dongSchema, r.indexerSchema, r.indexerSchema, constants.TransactionStatusFINALIZED, days)

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
		WHERE to_address = $1
			AND status = $2
			AND value > 0
	`, r.indexerSchema)

	var lastTS time.Time
	err = r.db.QueryRowContext(ctx, earlyCheckQuery, campaign.DonationWallet, constants.TransactionStatusFINALIZED).Scan(&lastTS)
	if err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0, TotalWithdrawn: 0}, fmt.Errorf("failed to check latest transaction vs stats: %w", err)
	}

	if lastTS.IsZero() || campaign.UpdatedAt.After(lastTS) {
		logger.Info().Int64("campaign_id", campaignID).Time("updated_at", campaign.UpdatedAt).Time("last_ts", lastTS).Msg("Campaign statistics are already up to date")
		return models.SyncCampaignResponse{TotalAmount: campaign.TotalAmount, TotalContributors: campaign.TotalContributor, TotalWithdrawn: campaign.TotalWithdrawn}, nil
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

	// Update statistics for this specific campaign
	// Get lookback window from config
	windowDays := 7 // default
	if cfg, err := config.LoadConfig("config/config.yml"); err == nil {
		if cfg.Scheduler.RecentStatsWindowDays > 0 {
			windowDays = cfg.Scheduler.RecentStatsWindowDays
		}
	}

	// Calculate recent_amount (sum of donations in lookback window)
	recentAmountQuery := fmt.Sprintf(`
		SELECT COALESCE(SUM(value), 0)
		FROM %s.transactions
		WHERE to_address = $1
		AND status = $2
		AND value > 0
		AND transaction_timestamp >= NOW() - INTERVAL '%d days'
	`, r.indexerSchema, windowDays)

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
				campaign_wallet,
				SUM(total_donate) as total_amount,
				COUNT(DISTINCT sender_wallet) as contributor_count,
				SUM(total_donate) - COALESCE(w.balance, 0) AS total_withdrawn
			FROM %s.campaign_contributor cc
			LEFT JOIN %s.wallet w ON w.address = cc.campaign_wallet
			WHERE cc.campaign_wallet = $1
			GROUP BY cc.campaign_wallet, w.balance
		) cc_stats ON dc.donation_wallet = cc_stats.campaign_wallet
		WHERE cs.campaign_wallet = dc.donation_wallet
		AND dc.id = $2
		RETURNING cs.total_amount, cs.total_contributor, cs.total_withdrawn, cs.recent_amount
	`, r.dongSchema, r.dongSchema, r.dongSchema, r.indexerSchema)

	var updatedTotalAmount int64
	var updatedTotalContributor int64
	var updatedTotalWithdrawn int64
	var updatedRecentAmount int64
	if err := r.db.QueryRowContext(ctx, updateStatsQuery, campaign.DonationWallet, campaignID, recentAmount).Scan(&updatedTotalAmount, &updatedTotalContributor, &updatedTotalWithdrawn, &updatedRecentAmount); err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0, TotalWithdrawn: 0, RecentAmount: 0}, fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	return models.SyncCampaignResponse{TotalAmount: updatedTotalAmount, TotalContributors: updatedTotalContributor, TotalWithdrawn: updatedTotalWithdrawn, RecentAmount: updatedRecentAmount}, nil
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

func (r *CampaignStatisticsRepository) RecordDonation(ctx context.Context, campaignID int64, amount int64, senderPtr *string, donationTime *time.Time) (models.SyncCampaignResponse, error) {
	// Get campaign wallet
	var campaignWallet string
	err := r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT donation_wallet FROM %s.donation_campaign WHERE id = $1`, r.dongSchema), campaignID).Scan(&campaignWallet)
	if err != nil {
		return models.SyncCampaignResponse{}, fmt.Errorf("failed to get campaign wallet: %w", err)
	}

	// Insert or update contributor
	if senderPtr != nil && *senderPtr != "" {
		upsertContributor := fmt.Sprintf(`
			INSERT INTO %s.campaign_contributor (sender_wallet, campaign_wallet, total_donate, updated_at)
			VALUES ($1, $2, $3, NOW())
			ON CONFLICT (sender_wallet, campaign_wallet)
			DO UPDATE SET total_donate = campaign_contributor.total_donate + EXCLUDED.total_donate, updated_at = NOW()
		`, r.dongSchema)
		_, err = r.db.ExecContext(ctx, upsertContributor, *senderPtr, campaignWallet, amount)
		if err != nil {
			return models.SyncCampaignResponse{}, fmt.Errorf("failed to upsert contributor: %w", err)
		}
	}

	// Insert transaction record (optional, if not already handled elsewhere)
	// -- Skipped here, assumed handled by indexer or other service --

	// Get lookback window from config
	windowDays := 7 // default
	if cfg, errCfg := config.LoadConfig("config/config.yml"); errCfg == nil {
		if cfg.Scheduler.RecentStatsWindowDays > 0 {
			windowDays = cfg.Scheduler.RecentStatsWindowDays
		}
	}

	// Calculate recent_amount (sum of donations in lookback window)
	recentAmountQuery := fmt.Sprintf(`
		SELECT COALESCE(SUM(value), 0)
		FROM %s.transactions
		WHERE to_address = $1
		AND status = $2
		AND value > 0
		AND transaction_timestamp >= NOW() - INTERVAL '%d days'
	`, r.indexerSchema, windowDays)
	var recentAmount int64
	err = r.db.QueryRowContext(ctx, recentAmountQuery, campaignWallet, constants.TransactionStatusFINALIZED).Scan(&recentAmount)
	if err != nil {
		recentAmount = 0 // fallback
	}

	// Update campaign_statistics for this campaign
	updateStatsQuery := fmt.Sprintf(`
		UPDATE %s.campaign_statistics cs
		SET 
			total_amount = cc_stats.total_amount,
			total_contributor = cc_stats.contributor_count,
			total_withdrawn = cc_stats.total_withdrawn,
			recent_amount = $2,
			updated_at = NOW()
		FROM (
			SELECT 
				campaign_wallet,
				SUM(total_donate) as total_amount,
				COUNT(DISTINCT sender_wallet) as contributor_count,
				SUM(total_donate) - COALESCE(w.balance, 0) AS total_withdrawn
			FROM %s.campaign_contributor cc
			LEFT JOIN %s.wallet w ON w.address = cc.campaign_wallet
			WHERE cc.campaign_wallet = $1
			GROUP BY cc.campaign_wallet, w.balance
		) cc_stats
		WHERE cs.campaign_wallet = cc_stats.campaign_wallet
		RETURNING cs.total_amount, cs.total_contributor, cs.total_withdrawn, cs.recent_amount
	`, r.dongSchema, r.dongSchema, r.indexerSchema)

	var updatedTotalAmount int64
	var updatedTotalContributor int64
	var updatedTotalWithdrawn int64
	var updatedRecentAmount int64
	if err := r.db.QueryRowContext(ctx, updateStatsQuery, campaignWallet, recentAmount).Scan(&updatedTotalAmount, &updatedTotalContributor, &updatedTotalWithdrawn, &updatedRecentAmount); err != nil {
		return models.SyncCampaignResponse{}, fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	return models.SyncCampaignResponse{
		TotalAmount:       updatedTotalAmount,
		TotalContributors: updatedTotalContributor,
		TotalWithdrawn:    updatedTotalWithdrawn,
		RecentAmount:      updatedRecentAmount,
	}, nil
}
