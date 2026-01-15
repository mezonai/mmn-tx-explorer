package scheduler

import (
	"context"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/repository"
	"dong-service/services"
	"time"
)

type CancelExpiredOrdersJob struct {
	orderRepo *repository.OrderRepository
}

func NewCancelExpiredOrdersJob(orderRepo *repository.OrderRepository) *CancelExpiredOrdersJob {
	return &CancelExpiredOrdersJob{orderRepo: orderRepo}
}

func (j *CancelExpiredOrdersJob) Run(ctx context.Context) error {
	logger.Info().Msg("Starting cancel expired orders job")

	db := database.GetDB()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error().Err(err).Msg("failed to begin tx for cancel expired orders")
		return err
	}

	cutoff := time.Now().UTC()
	count, err := j.orderRepo.CancelExpiredOrders(ctx, cutoff, tx)
	if err != nil {
		_ = tx.Rollback()
		logger.Error().Err(err).Msg("failed cancelling expired orders")
		return err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		logger.Error().Err(err).Msg("failed commit cancel expired orders")
		return err
	}

	if count > 0 {
		logger.Info().Int64("count", count).Msg("Cancelled expired orders")

		go services.SendSocketEvent(constants.ALL_RECEIVER, constants.OFFER_LIST_REFRESH, map[string]any{
			"action": "expired p2p orders",
		})

	} else {
		logger.Debug().Msg("No expired orders to cancel")
	}

	return nil
}

func CreateCancelExpiredOrdersTask(interval time.Duration, dongSchema string) Task {
	db := database.GetDB()
	orderRepo := repository.NewOrderRepository(db, dongSchema)

	job := NewCancelExpiredOrdersJob(orderRepo)

	return Task{
		Name:     "cancel_expired_orders",
		Interval: interval,
		Job:      job.Run,
	}
}
