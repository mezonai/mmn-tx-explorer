package main

import (
	"context"
	"dong-service/blockchain"
	"dong-service/config"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/middleware"
	"dong-service/routes"
	"dong-service/scheduler"
	"dong-service/services"
	"dong-service/utils"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

// @title           Dong Service API
// @version         1.0
// @description     API for managing donation campaigns
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.email  support@example.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8888
// @schemes http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {
	// Command-line flag for config file
	configFile := flag.String("f", "config/config.yml", "the config file")
	flag.Parse()

	// Load configuration
	cfg, err := config.LoadConfig(*configFile)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	if err := logger.InitLogger(&cfg.Logging); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}

	// Initialize encrypt key
	if err := utils.InitEncryptionKey(); err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize encryption key (AES_SECRET_KEY)")
	}
	
	logger.Info().
		Str("config_file", *configFile).
		Str("gin_mode", cfg.Server.GinMode).
		Msg("Dong Service starting")

	// Set Gin mode
	gin.SetMode(cfg.Server.GinMode)

	// Initialize database
	if err := database.InitDatabase(&cfg.Database); err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize database")
	}

	if err := database.InitRedisWhiteList(&cfg.Redis); err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize Redis whitelist")
	}

	logger.Info().Msg("Initializing Red Envelope Wallet Pool")
	startupInit := services.NewStartupInitializer()

	if err := startupInit.Initialize(); err != nil {
		logger.Error().Err(err).Msg("Failed to initialize wallet pool")
	}
	startupInit.StartBackgroundMaintenance()
	logger.Info().Msg("Background wallet pool maintenance started")

	blockchainService, err:= blockchain.NewBlockchainService(cfg)
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize blockchain service")
	}

	defer func() {
		if err := blockchainService.Close(); err != nil {
			logger.Error().Err(err).Msg("Failed to close blockchain service")
		}
	}()

	// Create Gin router
	r := gin.New()

	// Use middleware
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(&cfg.CORS))

	// Setup routes with dependency injection
	routes.SetupRoutes(r, cfg)

	// Initialize scheduler
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	schedulerInstance := scheduler.NewScheduler()

	// Add sync contributors task
	syncInterval := time.Duration(cfg.Scheduler.SyncContributorsInterval) * time.Second
	syncTask := scheduler.CreateSyncContributorsTask(syncInterval, cfg.Indexer.Schema, cfg.Database.Schema)
	schedulerInstance.AddTask(syncTask)

	expiryCheckInterval := time.Duration(cfg.Scheduler.ExpiredRedEnvelopesInterval) * time.Second
	expiryRedEnvelopeTask := scheduler.CreateRedEnvelopeExpiryTask(expiryCheckInterval, cfg.Database.Schema, blockchainService)
	schedulerInstance.AddTask(expiryRedEnvelopeTask)

	walletPoolMaintenanceInterval := time.Duration(cfg.Scheduler.WalletPoolMaintenanceInterval) * time.Second
	WalletPoolMaintenanceJob := scheduler.InitializeWalletPoolMaintenanceJob(walletPoolMaintenanceInterval)
	schedulerInstance.AddTask(WalletPoolMaintenanceJob)

	// Start scheduler
	schedulerInstance.Start(ctx)

	// Start server in a goroutine
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	logger.Info().Str("address", addr).Msg("Starting HTTP server")

	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Str("address", addr).Msg("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info().Msg("Shutting down server...")

	// Stop scheduler
	schedulerInstance.Stop()

	// Shutdown server with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	logger.Info().Msg("Server exited")
}
