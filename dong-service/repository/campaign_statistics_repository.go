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

	result, err := r.db.ExecContext(ctx, query, campaign.DonationWallet, constants.TransactionStatus_FINALIZED)
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
	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)

	query := fmt.Sprintf(`
		UPDATE %s.campaign_statistics cs
		SET 
			total_amount = cc_stats.total_amount,
			total_contributor = cc_stats.contributor_count,
			recent_amount = COALESCE(recent_stats.recent_amount, 0),
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
		LEFT JOIN (
			SELECT
				to_address as campaign_wallet,
				SUM(value) as recent_amount
			FROM %s.transactions
			WHERE status = $1 AND value > 0 AND transaction_timestamp >= $2
			GROUP BY to_address
		) recent_stats ON dc.donation_wallet = recent_stats.campaign_wallet
		WHERE cs.campaign_wallet = dc.donation_wallet
		AND dc.status = $3
	`, r.dongSchema, r.dongSchema, r.dongSchema, r.indexerSchema)

	result, err := r.db.ExecContext(ctx, query, constants.TransactionStatus_FINALIZED, cutoff, constants.CampaignStatusActive)
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
		SELECT dc.id, dc.donation_wallet, cs.updated_at, cs.total_amount, cs.total_contributor
		FROM %s.donation_campaign dc
		JOIN %s.campaign_statistics cs ON dc.id = cs.campaign_id
		WHERE dc.id = $1
	`, r.dongSchema, r.dongSchema)

	var campaign Campaign
	err := r.db.QueryRowContext(ctx, campaignQuery, campaignID).Scan(&campaign.ID, &campaign.DonationWallet, &campaign.UpdatedAt, &campaign.TotalAmount, &campaign.TotalContributor)
	if err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0}, fmt.Errorf("failed to get campaign: %w", err)
	}

	// If statistics are already newer than the latest finalized transaction for this wallet, skip sync
	earlyCheckQuery := fmt.Sprintf(`
		SELECT MAX(transaction_timestamp) AS last_ts
		FROM %s.transactions
		WHERE to_address = $1
			AND status = $2
			AND value > 0
	`, r.indexerSchema)

	var lastTs sql.NullTime
	err = r.db.QueryRowContext(ctx, earlyCheckQuery, campaign.DonationWallet, constants.TransactionStatus_FINALIZED).Scan(&lastTs)
	if err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0}, fmt.Errorf("failed to check latest transaction vs stats: %w", err)
	}

	// If there are no finalized transactions for this campaign wallet, lastTs.Valid will be false
	// In that case nothing to sync and we should skip (previous behavior skipped when lastTs.IsZero())
	if !lastTs.Valid || campaign.UpdatedAt.After(lastTs.Time) {
		logger.Info().Int64("campaign_id", campaignID).Time("updated_at", campaign.UpdatedAt).Time("last_ts", lastTs.Time).Msg("Campaign statistics are already up to date")
		return models.SyncCampaignResponse{TotalAmount: campaign.TotalAmount, TotalContributors: campaign.TotalContributor}, nil
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

	_, err = r.db.ExecContext(ctx, query, campaign.DonationWallet, constants.TransactionStatus_FINALIZED)
	if err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0}, fmt.Errorf("failed to sync contributors: %w", err)
	}

	// Update statistics for this specific campaign
	// use configured lookback window for recent amount
	lookback := time.Now().Add(-time.Duration(r.recentWindowDays) * 24 * time.Hour)

	updateStatsQuery := fmt.Sprintf(`
		UPDATE %s.campaign_statistics cs
		SET 
			total_amount = cc_stats.total_amount,
			total_contributor = cc_stats.contributor_count,
			recent_amount = COALESCE(recent_stats.recent_amount, 0),
			updated_at = NOW()
		FROM %s.donation_campaign dc
		INNER JOIN (
			SELECT 
				campaign_wallet,
				SUM(total_donate) as total_amount,
				COUNT(DISTINCT sender_wallet) as contributor_count
			FROM %s.campaign_contributor
			WHERE campaign_wallet = $1
			GROUP BY campaign_wallet
		) cc_stats ON dc.donation_wallet = cc_stats.campaign_wallet
		LEFT JOIN (
			SELECT
				to_address as campaign_wallet,
				SUM(value) as recent_amount
			FROM %s.transactions
			WHERE status = $2 AND value > 0 AND transaction_timestamp >= $3
			GROUP BY to_address
		) recent_stats ON dc.donation_wallet = recent_stats.campaign_wallet
		WHERE cs.campaign_wallet = dc.donation_wallet
		AND dc.id = $4
		RETURNING cs.total_amount, cs.total_contributor, cs.recent_amount
	`, r.dongSchema, r.dongSchema, r.dongSchema, r.indexerSchema)

	var updatedTotalAmount int64
	var updatedTotalContributor int64
	var updatedRecentAmount int64
	if err := r.db.QueryRowContext(ctx, updateStatsQuery, campaign.DonationWallet, constants.TransactionStatus_FINALIZED, lookback, campaignID).Scan(&updatedTotalAmount, &updatedTotalContributor, &updatedRecentAmount); err != nil {
		return models.SyncCampaignResponse{TotalAmount: 0, TotalContributors: 0}, fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	return models.SyncCampaignResponse{TotalAmount: updatedTotalAmount, TotalContributors: updatedTotalContributor, RecentAmount: updatedRecentAmount}, nil
}

// RecordDonation records a direct donation to a campaign and updates statistics immediately.
// This is a best-effort path used by the UI to reflect recent_amount and totals without waiting
// for the periodic indexer/sync job. It will upsert campaign_contributor (if senderWallet provided)
// and increment totals in campaign_statistics in a transaction.
// isWithinRecentWindow returns true if donationTime is inside the configured recent window.
// If donationTime is nil we treat it as 'now' (so it will usually be counted as recent).
func (r *CampaignStatisticsRepository) isWithinRecentWindow(donationTime *time.Time) bool {
	if r.recentWindowDays <= 0 {
		return false
	}
	var dt time.Time
	if donationTime == nil {
		dt = time.Now()
	} else {
		dt = *donationTime
	}
	cutoff := time.Now().Add(-time.Duration(r.recentWindowDays) * 24 * time.Hour)
	return !dt.Before(cutoff)
}

func (r *CampaignStatisticsRepository) RecordDonation(ctx context.Context, campaignID int64, amount int64, senderWallet *string, donationTime *time.Time) (models.SyncCampaignResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return models.SyncCampaignResponse{}, fmt.Errorf("failed to begin tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	var donationWallet string
	campaignQuery := fmt.Sprintf(`SELECT donation_wallet FROM %s.donation_campaign WHERE id = $1`, r.dongSchema)
	if err := tx.QueryRowContext(ctx, campaignQuery, campaignID).Scan(&donationWallet); err != nil {
		return models.SyncCampaignResponse{}, fmt.Errorf("failed to fetch campaign: %w", err)
	}

	contributorDelta := int64(0)
	if senderWallet != nil && *senderWallet != "" {
		var exists int
		existsQuery := fmt.Sprintf(`SELECT COUNT(1) FROM %s.campaign_contributor WHERE sender_wallet = $1 AND campaign_wallet = $2`, r.dongSchema)
		if err := tx.QueryRowContext(ctx, existsQuery, *senderWallet, donationWallet).Scan(&exists); err != nil {
			return models.SyncCampaignResponse{}, fmt.Errorf("failed to check contributor existence: %w", err)
		}

		if exists == 0 {
			insertQuery := fmt.Sprintf(`
				INSERT INTO %s.campaign_contributor (sender_wallet, campaign_wallet, total_donate)
				VALUES ($1, $2, $3)
			`, r.dongSchema)
			if _, err := tx.ExecContext(ctx, insertQuery, *senderWallet, donationWallet, amount); err != nil {
				return models.SyncCampaignResponse{}, fmt.Errorf("failed to insert campaign contributor: %w", err)
			}
			contributorDelta = 1
		} else {
			updateQuery := fmt.Sprintf(`
				UPDATE %s.campaign_contributor
				SET total_donate = total_donate + $1, updated_at = NOW()
				WHERE sender_wallet = $2 AND campaign_wallet = $3
			`, r.dongSchema)
			if _, err := tx.ExecContext(ctx, updateQuery, amount, *senderWallet, donationWallet); err != nil {
				return models.SyncCampaignResponse{}, fmt.Errorf("failed to update campaign contributor: %w", err)
			}
		}
	}

	countRecent := r.isWithinRecentWindow(donationTime)

	var updateStatsQuery string
	if countRecent {
		updateStatsQuery = fmt.Sprintf(`
			UPDATE %s.campaign_statistics
			SET total_amount = COALESCE(total_amount,0) + $1,
				total_contributor = COALESCE(total_contributor,0) + $2,
				recent_amount = COALESCE(recent_amount,0) + $1,
				updated_at = NOW()
			WHERE campaign_id = $3
			RETURNING total_amount, total_contributor, recent_amount
		`, r.dongSchema)
	} else {
		updateStatsQuery = fmt.Sprintf(`
			UPDATE %s.campaign_statistics
			SET total_amount = COALESCE(total_amount,0) + $1,
				total_contributor = COALESCE(total_contributor,0) + $2,
				updated_at = NOW()
			WHERE campaign_id = $3
			RETURNING total_amount, total_contributor, recent_amount
		`, r.dongSchema)
	}

	var totalAmount, totalContributor, recentAmount int64
	if err := tx.QueryRowContext(ctx, updateStatsQuery, amount, contributorDelta, campaignID).Scan(&totalAmount, &totalContributor, &recentAmount); err != nil {
		return models.SyncCampaignResponse{}, fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return models.SyncCampaignResponse{}, fmt.Errorf("failed to commit donation tx: %w", err)
	}

	return models.SyncCampaignResponse{TotalAmount: totalAmount, TotalContributors: totalContributor, RecentAmount: recentAmount}, nil
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

// GetTopCampaigns was removed — revert to previous behaviour of using GetAll + front-end filtering
