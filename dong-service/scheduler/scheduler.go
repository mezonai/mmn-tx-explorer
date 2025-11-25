package scheduler

import (
	"context"
	"dong-service/logger"
	"time"
)

// Scheduler manages scheduled tasks
type Scheduler struct {
	tasks    []Task
	stopChan chan struct{}
}

// Task represents a scheduled task
type Task struct {
	Name     string
	Interval time.Duration
	Job      func(ctx context.Context) error
}

// NewScheduler creates a new scheduler instance
func NewScheduler() *Scheduler {
	return &Scheduler{
		tasks:    make([]Task, 0),
		stopChan: make(chan struct{}),
	}
}

// AddTask adds a new task to the scheduler
func (s *Scheduler) AddTask(task Task) {
	s.tasks = append(s.tasks, task)
	logger.Info().
		Str("task", task.Name).
		Dur("interval", task.Interval).
		Msg("Task added to scheduler")
}

// Start starts all scheduled tasks
func (s *Scheduler) Start(ctx context.Context) {
	logger.Info().
		Int("task_count", len(s.tasks)).
		Msg("Starting scheduler")

	for _, task := range s.tasks {
		go s.runTask(ctx, task)
	}
}

// runTask runs a single task on its interval
func (s *Scheduler) runTask(ctx context.Context, task Task) {
	logger.Info().
		Str("task", task.Name).
		Msg("Task started")

	// Run immediately on start
	if err := task.Job(ctx); err != nil {
		logger.Error().
			Err(err).
			Str("task", task.Name).
			Msg("Task execution failed")
	}

	ticker := time.NewTicker(task.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info().
				Str("task", task.Name).
				Msg("Task stopped due to context cancellation")
			return
		case <-s.stopChan:
			logger.Info().
				Str("task", task.Name).
				Msg("Task stopped")
			return
		case <-ticker.C:
			logger.Debug().
				Str("task", task.Name).
				Msg("Executing scheduled task")

			if err := task.Job(ctx); err != nil {
				logger.Error().
					Err(err).
					Str("task", task.Name).
					Msg("Task execution failed")
			}
		}
	}
}

// Stop stops all scheduled tasks
func (s *Scheduler) Stop() {
	logger.Info().Msg("Stopping scheduler")
	close(s.stopChan)
}
