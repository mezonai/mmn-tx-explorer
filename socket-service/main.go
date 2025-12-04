package main

import (
	"context"
	"socket-service/config"
	"socket-service/database"
	"socket-service/logger"
	"socket-service/middleware"
	"socket-service/routers"
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


func main() {

	configFile := flag.String("f", "config/config.yml", "the config file")
	flag.Parse()
	cfg, err := config.LoadConfig(*configFile)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := logger.InitLogger(&cfg.Logging); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}

	logger.Info().
		Str("config_file", *configFile).
		Str("gin_mode", cfg.Server.GinMode).
		Msg("Socket Service starting")

	gin.SetMode(cfg.Server.GinMode)


	if err := database.InitDatabase(&cfg.Database); err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize database")
	}

	if err := database.InitRedisWhiteList(&cfg.Redis); err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize Redis")
	}

	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(middleware.Logger())

	routers.SetupRouters(r, cfg)

	_ , cancel := context.WithCancel(context.Background())
	defer cancel()



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

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info().Msg("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	logger.Info().Msg("Server exited")
}