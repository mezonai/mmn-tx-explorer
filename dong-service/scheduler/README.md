# Scheduler Package

This package provides a flexible scheduler for running periodic tasks in the Dong Service.

## Overview

The scheduler runs background jobs at configurable intervals. Currently, it includes:

### Sync Contributors Job

This job synchronizes transaction data from the indexer schema to the `campaign_contributor` table.

**What it does:**

1. Queries all active donation campaigns from the `donation_campaign` table
2. For each campaign, queries transactions from the `indexer.transactions` table where:
   - `to_address` matches the campaign's `donation_wallet`
   - `status = 1` (successful transactions)
   - `value > 0` (has donation amount)
3. Upserts contributor records into the `campaign_contributor` table:
   - If the contributor is new, inserts a new record
   - If the contributor exists, updates the total donation amount and last transaction timestamp
4. Updates the `total_amount` and `total_contributor` columns in the `donation_campaign` table

**Configuration:**

The sync interval is configured in `config/config.yml`:

```yaml
scheduler:
  sync_contributors_interval: 300  # sync every 5 minutes (300 seconds)
```

**Database Schema Requirements:**

The job requires:
- Access to the indexer schema (configured via `indexer.schema` in config)
- The `campaign_contributor` table must have a unique constraint on `(sender_wallet, campaign_wallet)`
- The `donation_campaign` table must have `total_amount` and `total_contributor` columns

**Logging:**

The job logs:
- Start and completion of each sync run
- Number of campaigns processed
- Number of transactions processed, inserted, and updated
- Any errors encountered during processing

## Adding New Scheduled Tasks

To add a new scheduled task:

1. Create a new job struct and implement the `Run(ctx context.Context) error` method
2. Create a factory function that returns a `Task` struct
3. Add the task to the scheduler in `main.go`

Example:

```go
// Create a new job
type MyJob struct {
    db *sql.DB
}

func (j *MyJob) Run(ctx context.Context) error {
    // Your job logic here
    return nil
}

// Create a task factory
func CreateMyTask(interval time.Duration) Task {
    job := &MyJob{db: database.GetDB()}
    return Task{
        Name:     "my_task",
        Interval: interval,
        Job:      job.Run,
    }
}

// In main.go
myTask := scheduler.CreateMyTask(10 * time.Minute)
sched.AddTask(myTask)
```

## Graceful Shutdown

The scheduler supports graceful shutdown. When the application receives a SIGINT or SIGTERM signal, it will:

1. Stop accepting new task executions
2. Wait for currently running tasks to complete (with context cancellation)
3. Shutdown the HTTP server
4. Exit cleanly

