package main

import (
	"dong-service/config"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/middleware"
	"dong-service/routes"
	"flag"
	"fmt"
	"log"

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

	// Create Gin router
	r := gin.New()

	// Use middleware
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(&cfg.CORS))

	// Setup routes with dependency injection
	routes.SetupRoutes(r, cfg)

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	logger.Info().Str("address", addr).Msg("Starting HTTP server")

	if err := r.Run(addr); err != nil {
		logger.Fatal().Err(err).Str("address", addr).Msg("Failed to start server")
	}
}
