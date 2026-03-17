package services

import (
	"context"
	"database/sql"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/repository"
	"fmt"
	"time"
)

type StartupInitializer struct {
	db                *sql.DB
	dongSchema        string
	walletPoolService *WalletPoolService
	queueService      *repository.RedEnvelopeQueueService
}

func NewStartupInitializer(db *sql.DB, dongSchema string, queueService *repository.RedEnvelopeQueueService) *StartupInitializer {
	redEnvelopeWalletRepo := repository.NewIntermediaryWalletRepository(db, dongSchema)
	walletPoolService := NewWalletPoolService(redEnvelopeWalletRepo)

	return &StartupInitializer{
		db:                db,
		dongSchema:        dongSchema,
		walletPoolService: walletPoolService,
		queueService:      queueService,
	}
}

func (s *StartupInitializer) Initialize() error {
	ctx := context.Background()

	logger.Info().Msg("Syncing Red Envelope Queues to Redis...")
	err := s.SyncRedEnvelopeQueues(ctx)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to sync red envelope queues")
		// We continue even if sync fails, but log a loud error
	}

	logger.Info().Msg("Initializing Red Envelope Wallet Pool...")
	err = s.initializeWalletPool(ctx)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to initialize wallet pool")
		return err
	}
	logger.Info().Msg("Wallet pool initialized successfully")

	logger.Info().Msg("Checking wallet pool health...")
	err = s.checkPoolHealth(ctx)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to check pool health")
		return err
	}
	logger.Info().Msg("Wallet pool health check completed")
	return nil
}

func (s *StartupInitializer) initializeWalletPool(ctx context.Context) error {
	err := s.walletPoolService.InitializePoolIfNeeded(ctx)
	if err != nil {
		return err
	}

	stats, err := s.walletPoolService.redEnvelopeWalletRepo.GetPoolStatistics(ctx)
	if err != nil {
		logger.Warn().Err(err).Msg("Could not retrieve final statistics")
		return nil
	}

	logger.Info().
		Interface("pool_stats", stats).
		Msg("Wallet pool initialization complete")

	return nil
}

func (s *StartupInitializer) checkPoolHealth(ctx context.Context) error {
	minReady := constants.RedEnvelopeInitialWalletPool / 5

	err := s.walletPoolService.EnsureMinimumWallets(ctx, minReady)
	if err != nil {
		return err
	}

	return nil
}

func (s *StartupInitializer) SyncRedEnvelopeQueues(ctx context.Context) error {
	// 1. Fetch all PUBLISHED red envelopes
	query := fmt.Sprintf(`
		SELECT id, description, end_date
		FROM %s.red_envelope
		WHERE status = 'PUBLISHED'
	`, s.dongSchema)

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to query published envelopes: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, description string
		var endDate *time.Time
		if err := rows.Scan(&id, &description, &endDate); err != nil {
			logger.Error().Err(err).Msg("Failed to scan red envelope for sync")
			continue
		}

		// Clear Redis pool before syncing to ensure idempotency if app restarts
		if err := s.queueService.ClearPool(id); err != nil {
			logger.Warn().Err(err).Str("id", id).Msg("Failed to clear Redis pool before sync")
		}

		ttl := 48 * time.Hour
		if endDate != nil {
			ttl = time.Until(*endDate)
			if ttl < 0 {
				ttl = 1 * time.Hour // Minimum TTL if already expired but still PUBLISHED
			}
		}

		// 2. Sync AVAILABLE splits to Redis pool
		availableQuery := fmt.Sprintf(`
			SELECT amount
			FROM %s.red_envelope_split_money
			WHERE red_envelope_id = $1 AND status = 'AVAILABLE'
			ORDER BY claim_order ASC
		`, s.dongSchema)

		availRows, err := s.db.QueryContext(ctx, availableQuery, id)
		if err != nil {
			logger.Error().Err(err).Str("id", id).Msg("Failed to query available splits")
			continue
		}

		var amounts []int64
		for availRows.Next() {
			var amount int64
			if err := availRows.Scan(&amount); err != nil {
				logger.Error().Err(err).Msg("Failed to scan split amount")
				continue
			}
			amounts = append(amounts, amount)
		}
		availRows.Close()

		if len(amounts) > 0 {
			err = s.queueService.InitializeRedEnvelope(id, amounts, description, ttl)
			if err != nil {
				logger.Error().Err(err).Str("id", id).Msg("Failed to initialize Redis pool during sync")
			} else {
				logger.Info().Str("id", id).Int("count", len(amounts)).Msg("Synced available splits to Redis")
			}
		}

		// 3. Sync RESERVED splits to Redis reserved hash
		reservedQuery := fmt.Sprintf(`
			SELECT claimed_user_id, amount
			FROM %s.red_envelope_split_money
			WHERE red_envelope_id = $1 AND status = 'RESERVED' AND claimed_user_id IS NOT NULL
		`, s.dongSchema)

		resRows, err := s.db.QueryContext(ctx, reservedQuery, id)
		if err != nil {
			logger.Error().Err(err).Str("id", id).Msg("Failed to query reserved splits")
			continue
		}

		reservedCount := 0
		for resRows.Next() {
			var userID, amount int64
			if err := resRows.Scan(&userID, &amount); err != nil {
				logger.Error().Err(err).Msg("Failed to scan reserved split")
				continue
			}
			err = s.queueService.SetReservation(id, userID, amount, ttl)
			if err != nil {
				logger.Error().Err(err).Str("id", id).Int64("user_id", userID).Msg("Failed to set Redis reservation during sync")
			} else {
				reservedCount++
			}
		}
		resRows.Close()

		if reservedCount > 0 {
			logger.Info().Str("id", id).Int("count", reservedCount).Msg("Synced reserved splits to Redis")
		}
	}

	return nil
}

func (s *StartupInitializer) StartBackgroundMaintenance() {
	logger.Info().Msg("Starting background wallet pool maintenance")

	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			ctx := context.Background()
			logger.Info().Msg("Running scheduled wallet pool health check")

			minReady := constants.RedEnvelopeInitialWalletPool / 5
			err := s.walletPoolService.EnsureMinimumWallets(ctx, minReady)
			if err != nil {
				logger.Error().
					Err(err).
					Msg("Scheduled wallet pool health check failed")
			} else {
				logger.Info().Msg("Scheduled wallet pool health check completed")
			}
		}
	}()
}
