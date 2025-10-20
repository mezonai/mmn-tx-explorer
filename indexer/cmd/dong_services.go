package cmd

import (
	"context"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	dong_handlers "github.com/mezonai/mmn-tx-explorer/indexer/internal/handlers/dong"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/middleware"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var (
	dongServiceCmd = &cobra.Command{
		Use: "dong-service",
		Run: func(cmd *cobra.Command, args []string) {
			RunDongServiceApi(cmd, args)
		},
	}
)

func RunDongServiceApi(cmd *cobra.Command, args []string) {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	r := gin.New()
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())
    
	root := r.Group("/services")
	{
		// root.Use(middleware.Authorization)
		root.Use(middleware.Cors)
		root.POST("/campaign/create", dong_handlers.CreateCampaign)
	    root.GET("/campaign/list", dong_handlers.ListCampaigns)
		root.GET("/campaign/:id", dong_handlers.GetCampaign)
		root.POST("/donation/update", dong_handlers.UpdateCampaign)
	}

	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "service is running")
	})

	srv := &http.Server{
		Addr:    ":8088",
		Handler: r,
	}

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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("API server forced to shutdown")
	}

	log.Info().Msg("API server exiting")
}
