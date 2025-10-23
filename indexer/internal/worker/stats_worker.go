package worker

import (
	"context"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/thirdweb-dev/indexer/internal/storage"
)

// StatsRecalculationWorker handles periodic stats recalculation
type StatsRecalculationWorker struct {
	mainStorage storage.IMainStorage
	interval    time.Duration
	stopCh      chan struct{}
	wg          sync.WaitGroup
	running     bool
	mutex       sync.Mutex
}

// NewStatsRecalculationWorker creates a new stats recalculation worker
func NewStatsRecalculationWorker(mainStorage storage.IMainStorage, intervalMinutes int) *StatsRecalculationWorker {
	if intervalMinutes <= 0 {
		intervalMinutes = 60 // Default to 1 hour if invalid interval
	}
	
	return &StatsRecalculationWorker{
		mainStorage: mainStorage,
		interval:    time.Duration(intervalMinutes) * time.Minute,
		stopCh:      make(chan struct{}),
		running:     false,
	}
}

// Start begins the periodic stats recalculation
func (w *StatsRecalculationWorker) Start() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.running {
		return
	}

	w.running = true
	w.wg.Add(1)

	go func() {
		defer w.wg.Done()
		
		// Run once immediately at startup
		w.recalculateStats()
		
		ticker := time.NewTicker(w.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				w.recalculateStats()
			case <-w.stopCh:
				log.Info().Msg("Stats recalculation worker stopped")
				return
			}
		}
	}()

	log.Info().
		Dur("interval", w.interval).
		Msg("Stats recalculation worker started")
}

// Stop halts the worker
func (w *StatsRecalculationWorker) Stop() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if !w.running {
		return
	}

	close(w.stopCh)
	w.wg.Wait()
	w.running = false
}

// recalculateStats performs the actual stats recalculation
func (w *StatsRecalculationWorker) recalculateStats() {
	log.Info().Msg("Starting scheduled stats recalculation")
	start := time.Now()

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
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