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
)

var (
	apiCmd = &cobra.Command{
		Use:   "api",
		Short: "TBD",
		Long:  "TBD",
		Run: func(cmd *cobra.Command, args []string) {
			RunApi(cmd, args)
		},
	}
)

// @title Mezon Dong
// @version v0.0.1-beta
// @description API for querying blockchain transactions and events
// @license.name Apache 2.0
// @license.url https://github.com/mezonai/mmn-tx-explorer/indexer/blob/main/LICENSE
// @BasePath /
// @Security BasicAuth
// @securityDefinitions.basic BasicAuth
func RunApi(cmd *cobra.Command, args []string) {

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	mainStorage, err := storage.GetMainStorage()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create storage connector")
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

	root := r.Group("/:chainId")
	{
		root.Use(middleware.Cors)
		root.Use(middleware.Authorization)
		// wildcard queries
		root.GET("/transactions", handlers.GetTransactions)
		root.GET("/pending-transactions", handlers.GetPendingTransactions)
		root.GET("/pending-tx/:transaction_hash/detail", handlers.GetPendingTransactionDetail)

		// wallet queries
		root.GET("/wallets", handlers.GetWallets)
		root.GET("/wallets/:address/detail", handlers.GetWalletDetail)

		// blocks table queries
		root.GET("/blocks", handlers.GetBlocks)
		root.GET("/blocks/:blockNumber/detail", handlers.GetBlockDetail)

		root.GET("/tx/:txHash/detail", handlers.GetTransactionDetail)

		// internal endpoint (without extra_info field)
		root.GET("/internal/tx/:txHash/detail", handlers.GetInternalTransactionDetail)

		// stats queries
		root.GET("/stats/dashboard", handlers.GetDashboardStats)
		root.GET("/stats/transactions", handlers.GetTransactionStats)

		// search
		root.GET("/search/:input", handlers.Search)
	}

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
		log.Fatal().Err(err).Msg("API server forced to shutdown")
	}

	log.Info().Msg("API server exiting")
}
