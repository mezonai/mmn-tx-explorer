package scheduler

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/repository"
	"time"
)

type WalletPoolMaintenanceJob struct {
	redEnvelopeWalletRepo *repository.RedEnvelopeWalletRepository
}

func NewWalletPoolMaintenanceJob(
	redEnvelopeWalletRepo *repository.RedEnvelopeWalletRepository,
) *WalletPoolMaintenanceJob {
	return &WalletPoolMaintenanceJob{
		redEnvelopeWalletRepo: redEnvelopeWalletRepo,
	}
}

func (j *WalletPoolMaintenanceJob) Run(ctx context.Context) error {
	logger.Info().Msg("Starting wallet pool maintenance job")

	oldWallets, err := j.redEnvelopeWalletRepo.FindOldReadyWallets(ctx, constants.RedEnvelopeWalletMaxAgeInDays)
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

func InitializeWalletPoolMaintenanceJob(interval time.Duration) Task {
	db := database.GetDB()
	redEnvelopeWalletRepo := repository.NewRedEnvelopeWalletRepository(db)
	job := NewWalletPoolMaintenanceJob(redEnvelopeWalletRepo)
	return Task{
		Name:     "WalletPoolMaintenanceJob",
		Interval: interval,
		Job:      job.Run,
	}
}
