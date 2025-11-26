package scheduler

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/repository"

	"github.com/robfig/cron/v3"
)

type WalletPoolMaintenanceJob struct {
	redEnvelopeWalletRepo *repository.IntermediaryWalletRepository
}

func NewWalletPoolMaintenanceJob(
	redEnvelopeWalletRepo *repository.IntermediaryWalletRepository,
) *WalletPoolMaintenanceJob {
	return &WalletPoolMaintenanceJob{
		redEnvelopeWalletRepo: redEnvelopeWalletRepo,
	}
}

func (j *WalletPoolMaintenanceJob) Run(ctx context.Context) error {
	logger.Info().Msg("Starting wallet pool maintenance job")

	oldWallets, err := j.redEnvelopeWalletRepo.FindOldWallets(ctx, constants.RedEnvelopeWalletMaxAgeInDays)
	if err != nil {
		logger.Error().Err(err).Msg("Error finding old wallets")
		return err
	}

	if len(oldWallets) == 0 {
		logger.Info().Msg("No old wallets found")
		return nil
	}

	logger.Info().Int("count", len(oldWallets)).Msg("Found old READY wallets to disable")

	var walletIDs []int64
	for _, wallet := range oldWallets {
		walletIDs = append(walletIDs, wallet.ID)
	}

	err = j.redEnvelopeWalletRepo.DisableWallets(ctx, walletIDs)
	if err != nil {
		logger.Error().Err(err).Msg("Error disabling old wallets")
		return err
	}

	logger.Info().Int("count", len(walletIDs)).Msg("Successfully disabled old wallets")

	stats, err := j.redEnvelopeWalletRepo.GetPoolStatistics(ctx)
	if err != nil {
		logger.Error().Err(err).Msg("Error getting pool statistics")
		return err
	}

	logger.Info().Interface("stats", stats).Msg("Wallet pool statistics")
	return nil
}

func InitializeWalletPoolMaintenanceJob(c *cron.Cron, ctx context.Context, dongSchema string) {
	taskName := "WalletPoolMaintenanceJob"

	db := database.GetDB()
	repo := repository.NewIntermediaryWalletRepository(db, dongSchema)
	job := NewWalletPoolMaintenanceJob(repo)

	entryID, err := c.AddFunc("0 2 * * *", func() {
		if err := job.Run(ctx); err != nil {
			logger.Error().Str("task", taskName).Err(err).Msg("Job execution failed")
		} else {
			logger.Info().Str("task", taskName).Msg("Job execution completed successfully")
		}
	})

	if err != nil {
		logger.Fatal().Str("task", taskName).Err(err).Msg("Failed to register cron job")
	}

	logger.Info().
		Str("task", taskName).
		Int("entry_id", int(entryID)).
		Msg("Registered cron job (Schedule: 02:00 Daily)")
}
