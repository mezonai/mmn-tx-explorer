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

type RecentAmountJob struct {
	statsRepo    *repository.CampaignStatisticsRepository
	lookbackDays int
}

func NewRecentAmountJob(db *sql.DB, indexerSchema, dongSchema string, lookbackDays int) *RecentAmountJob {
	return &RecentAmountJob{
		statsRepo:    repository.NewCampaignStatisticsRepository(db, indexerSchema, dongSchema, lookbackDays),
		lookbackDays: lookbackDays,
	}
}

func (j *RecentAmountJob) Run(ctx context.Context) error {
	start := time.Now()
	logger.Info().Msg("Starting recent_amount cron job: updating campaign_statistics.recent_amount")

	days := j.lookbackDays
	if days <= 0 {
		days = 7
	}

	affected, err := j.statsRepo.UpdateCampaignStatistics(ctx, days)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to update campaign statistics recent_amount")
		return fmt.Errorf("failed to update campaign statistics: %w", err)
	}

	dur := time.Since(start)
	logger.Info().Int64("rows_affected", affected).Dur("duration", dur).Msg("recent_amount update completed")
	return nil
}

func CreateRecentAmountTask(interval time.Duration, indexerSchema, dongSchema string, lookbackDays int) Task {
	job := NewRecentAmountJob(database.GetDB(), indexerSchema, dongSchema, lookbackDays)

	return Task{
		Name:     "recent_amount_update",
		Interval: interval,
		Job:      job.Run,
	}
}
