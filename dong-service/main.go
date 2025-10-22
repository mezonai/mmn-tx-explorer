package main

import (
	"dong-service/config"
	"dong-service/database"
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
func main() {
	// Command-line flag for config file
	configFile := flag.String("f", "config/config.yml", "the config file")
	flag.Parse()

	// Load configuration
	cfg, err := config.LoadConfig(*configFile)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
    config.Cfg = cfg

	// Set Gin mode
	gin.SetMode(cfg.Server.GinMode)

	// Initialize database
	if err := database.InitDatabase(&cfg.Database); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	if err := database.InitRedisWhiteList(&cfg.Redis); err != nil {
		log.Fatalf("Failed to initialize Redis whitelist: %v", err)
	}

	// Create Gin router
	r := gin.New()

	// Use middleware
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(&cfg.CORS))

	// Setup routes
	routes.SetupRoutes(r)

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Starting server on %s", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
