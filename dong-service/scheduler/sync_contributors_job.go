package scheduler

import (
	"context"
	"database/sql"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/repository"
	"fmt"
	"time"
)

// SyncContributorsJob syncs transactions from indexer schema to campaign_contributor table
type SyncContributorsJob struct {
	statsRepo        *repository.CampaignStatisticsRepository
	recentWindowDays int
}

// NewSyncContributorsJob creates a new sync contributors job
func NewSyncContributorsJob(db *sql.DB, indexerSchema, dongSchema string, recentWindowDays int) *SyncContributorsJob {
	return &SyncContributorsJob{
		statsRepo:        repository.NewCampaignStatisticsRepository(db, indexerSchema, dongSchema, recentWindowDays),
		recentWindowDays: recentWindowDays,
	}
}

// Run executes the sync job
func (j *SyncContributorsJob) Run(ctx context.Context) error {
	startTime := time.Now()
	logger.Info().Msg("Starting sync contributors job")

	// Get all active donation campaigns
	campaigns, err := j.statsRepo.GetActiveCampaigns(ctx)
	if err != nil {
		return fmt.Errorf("failed to get active campaigns: %w", err)
	}

	if len(campaigns) == 0 {
		logger.Info().Msg("No active campaigns found")
		return nil
	}

	logger.Info().
		Int("campaign_count", len(campaigns)).
		Msg("Found active campaigns")

	// Process each campaign
	totalProcessed := 0
	totalInserted := 0
	totalUpdated := 0
	var statsRowsAffected int64

	for _, campaign := range campaigns {
		processed, inserted, updated, syncErr := j.statsRepo.SyncCampaignTransactions(ctx, campaign)
		if syncErr != nil {
			logger.Error().
				Err(syncErr).
				Int64("campaign_id", campaign.ID).
				Str("donation_wallet", campaign.DonationWallet).
				Msg("Failed to sync campaign transactions")
			continue
		}

		totalProcessed += processed
		totalInserted += inserted
		totalUpdated += updated

		logger.Info().
			Int64("campaign_id", campaign.ID).
			Str("donation_wallet", campaign.DonationWallet).
			Int("processed", processed).
			Int("inserted", inserted).
			Int("updated", updated).
			Msg("Campaign transactions synced")
	}

	// Update campaign statistics (separate table to avoid locking)
	statsRowsAffected, err = j.statsRepo.UpdateCampaignStatistics(ctx, j.recentWindowDays)
	if err != nil {
		logger.Error().
			Err(err).
			Msg("Failed to update campaign statistics")
	} else {
		logger.Info().
			Int64("stats_rows_affected", statsRowsAffected).
			Msg("Campaign statistics updated")
	}

	// Update P2P offer stats
	totalP2POfferAmount, err := j.statsRepo.UpdateTotalP2POfferStat(ctx)
	if err != nil {
		logger.Error().
			Err(err).
			Msg("Failed to update total_p2p_offer_available stat")
	} else {
		logger.Info().
			Int64("total_p2p_offer_amount", totalP2POfferAmount).
			Msg("P2P offer stats updated")
	}

	duration := time.Since(startTime)
	logger.Info().
		Int("total_processed", totalProcessed).
		Int("total_inserted", totalInserted).
		Int("total_updated", totalUpdated).
		Int64("stats_rows_affected", statsRowsAffected).
		Dur("duration", duration).
		Msg("Sync contributors job completed")

	return nil
}

// CreateSyncContributorsTask creates a new sync contributors task
func CreateSyncContributorsTask(interval time.Duration, indexerSchema, dongSchema string, recentWindowDays int) Task {
	job := NewSyncContributorsJob(database.GetDB(), indexerSchema, dongSchema, recentWindowDays)

	return Task{
		Name:     "sync_contributors",
		Interval: interval,
		Job:      job.Run,
	}
}
