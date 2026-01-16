package cmd

import (
	"context"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/swaggo/swag"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/handlers"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/middleware"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/worker"

	// Import the generated Swagger docs
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	_ "github.com/mezonai/mmn-tx-explorer/indexer/docs"

	// Import pprof
	_ "net/http/pprof"
)

var (
	apiCmd = &cobra.Command{
		Use:   "api",
		Short: "TBD",
		Long:  "TBD",
		Run: func(cmd *cobra.Command, args []string) {
			RunAPI(cmd, args)
		},
	}
)

// RunAPI godoc
// @title Mezon Dong
// @version v0.0.1-beta
// @description API for querying blockchain transactions and events
// @license.name Apache 2.0
// @license.url https://github.com/mezonai/mmn-tx-explorer/indexer/blob/main/LICENSE
// @BasePath /
// @Security BasicAuth
// @securityDefinitions.basic BasicAuth
func RunAPI(cmd *cobra.Command, args []string) {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Err(err).Msg("Failed to create storage connector")
		return
	}

	if config.Cfg.StatsWorker.Enabled {
		log.Info().Int("intervalMinutes", config.Cfg.StatsWorker.IntervalMinutes).Int("timeoutMinutes", config.Cfg.StatsWorker.TimeoutMinutes).Msg("Starting stats recalculation worker")
		statsWorker := worker.NewStatsRecalculationWorker(mainStorage, config.Cfg.StatsWorker.IntervalMinutes, config.Cfg.StatsWorker.TimeoutMinutes)
		statsWorker.Start()
	}

	r := gin.New()
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// Add Swagger route
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// Add Swagger JSON endpoint
	r.GET("/openapi.json", func(c *gin.Context) {
		doc, err := swag.ReadDoc()
		if err != nil {
			log.Error().Err(err).Msg("Failed to read Swagger documentation")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to provide Swagger documentation"})
			return
		}
		c.Header("Content-Type", "application/json")
		c.String(http.StatusOK, doc)
	})

	// v1 API routes - json responses
	v1 := r.Group("/:chainId")
	v1.Use(middleware.Authorization)
	v1.Use(middleware.Cors)

	// wildcard queries
	v1.GET("/transactions", handlers.GetTransactions)
	v1.GET("/pending-transactions", handlers.GetPendingTransactions)
	v1.GET("/pending-tx/:transaction_hash/detail", handlers.GetPendingTransactionDetail)
	v1.GET("/transactions/infinite", handlers.GetTransactionsInfiniteJSON)
	v1.GET("/export-transactions-csv", handlers.ExportTransactionsCSV)

	// wallet queries
	v1.GET("/wallets", handlers.GetWallets)
	v1.GET("/wallets/:address/detail", handlers.GetWalletDetail)

	// blocks table queries
	v1.GET("/blocks", handlers.GetBlocks)
	v1.GET("/blocks/:blockNumber/detail", handlers.GetBlockDetail)

	v1.GET("/tx/:txHash/detail", handlers.GetTransactionDetail)
	// internal endpoint (without extra_info field)
	v1.GET("/internal/tx/:txHash/detail", handlers.GetInternalTransactionDetail)

	// stats queries
	v1.GET("/stats/dashboard", handlers.GetDashboardStats)
	v1.GET("/stats/transactions", handlers.GetTransactionStats)

	// search
	v1.GET("/search/:input", handlers.Search)

	// v2 API routes - protobuf binary responses
	v2 := r.Group("/v2/:chainId")
	v2.Use(middleware.Authorization)
	v2.Use(middleware.Cors)
	v2.GET("/transactions/infinite", handlers.GetTransactionsInfiniteProto)

	r.GET("/health", handlers.Health)

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	// Initializing the server in a goroutine so that
	// it won't block the graceful shutdown handling below
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("listen: %s\n")
		}
	}()

	registerPprof()

	// Listen for the interrupt signal.
	<-ctx.Done()

	// Restore default behavior on the interrupt signal and notify user of shutdown.
	stop()
	log.Info().Msg("shutting down API gracefully")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Err(err).Msg("API server forced to shutdown")
		return
	}

	log.Info().Msg("API server exiting")
}

func registerPprof() {
	go func() {
		if err := http.ListenAndServe(":6060", nil); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("pprof server failed")
		}
	}()
}
