package worker

import (
	"context"
	"sync"
	"time"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/rs/zerolog/log"
)

// StatsRecalculationWorker handles periodic stats recalculation
type StatsRecalculationWorker struct {
	mainStorage     storage.IMainStorage
	intervalMinutes int
	timeoutMinutes  int
	ticker          *time.Ticker
	stopChan        chan struct{}
	mutex           sync.Mutex
	isRunning       bool
	wg              sync.WaitGroup
}

// NewStatsRecalculationWorker creates a new stats recalculation worker
func NewStatsRecalculationWorker(mainStorage storage.IMainStorage, intervalMinutes, timeoutMinutes int) *StatsRecalculationWorker {
	if intervalMinutes <= 0 {
		intervalMinutes = 120 // Default to 2 hours if invalid interval
	}

	if timeoutMinutes <= 0 {
		timeoutMinutes = 10 // Default to 10 minutes if invalid timeout
	}

	return &StatsRecalculationWorker{
		mainStorage:     mainStorage,
		intervalMinutes: intervalMinutes,
		timeoutMinutes:  timeoutMinutes,
		stopChan:        make(chan struct{}),
		isRunning:       false,
	}
}

// Start begins the periodic stats recalculation
func (w *StatsRecalculationWorker) Start() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.isRunning {
		return
	}

	w.isRunning = true
	w.wg.Add(1)

	go func() {
		defer w.wg.Done()

		// Run once immediately at startup
		w.recalculateStats()

		w.ticker = time.NewTicker(time.Duration(w.intervalMinutes) * time.Minute)
		defer w.ticker.Stop()

		for {
			select {
			case <-w.ticker.C:
				w.recalculateStats()
			case <-w.stopChan:
				log.Info().Msg("Stats recalculation worker stopped")
				return
			}
		}
	}()

	log.Info().
		Int("intervalMinutes", w.intervalMinutes).
		Int("timeoutMinutes", w.timeoutMinutes).
		Msg("Stats recalculation worker started")
}

// Stop halts the worker
func (w *StatsRecalculationWorker) Stop() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if !w.isRunning {
		return
	}

	close(w.stopChan)
	w.wg.Wait()
	w.isRunning = false
}

// recalculateStats performs the actual stats recalculation
func (w *StatsRecalculationWorker) recalculateStats() {
	log.Info().Msg("Starting scheduled stats recalculation")
	start := time.Now()

	// Create context with timeout from config
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(w.timeoutMinutes)*time.Minute)
	defer cancel()

	// Recalculate stats
	err := w.mainStorage.RecalculateStats(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to recalculate stats")
		return
	}

	duration := time.Since(start)
	log.Info().
		Dur("duration", duration).
		Msg("Stats recalculation completed successfully")
}
