package routes

import (
	"dong-service/blockchain"
	"dong-service/config"
	"dong-service/database"
	_ "dong-service/docs" // Import docs to load swagger documentation
	"dong-service/handlers"
	"dong-service/logger"
	"dong-service/middleware"
	"dong-service/repository"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRoutes configures all application routes with dependency injection
func SetupRoutes(router *gin.Engine, cfg *config.Config) {
	// Health check endpoint
	router.GET("/health", handlers.Health)

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Initialize auth handler with config
	authHandler := handlers.NewAuthHandler(cfg)

	// Auth routes
	router.POST("/oauth", authHandler.OauthHandler)
	router.POST("/refresh", authHandler.RefreshHandler)
	router.POST("/logout", authHandler.LogoutHandler)

	blockchainService, err := blockchain.NewBlockchainService(cfg)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to initialize blockchain service")
	}

	walletRepo := repository.NewRedEnvelopeWalletRepository(database.GetDB())
	redEnvelopeRepo := repository.NewRedEnvelopeRepository(database.GetDB(), cfg.Database.Schema, blockchainService, walletRepo)
	redEnvelopeWalletRepo := repository.NewRedEnvelopeWalletRepository(database.GetDB())
	redEnvelopeHandler := handlers.NewRedEnvelopeHandler(redEnvelopeRepo, redEnvelopeWalletRepo)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Initialize repositories
		campaignRepo := repository.NewDonationCampaignRepository(database.GetDB(), cfg.Database.Schema)
		statsRepo := repository.NewCampaignStatisticsRepository(database.GetDB(), cfg.Indexer.Schema, cfg.Database.Schema)

		// Initialize handlers
		campaignHandler := handlers.NewDonationCampaignHandler(campaignRepo)
		statsHandler := handlers.NewCampaignStatisticsHandler(statsRepo)

		// Campaign routes (protected)
		campaigns_private := v1.Group("/admin/campaigns")
		{
			campaigns_private.Use(middleware.Authentication(cfg.JWT.Secret))
			campaigns_private.POST("", campaignHandler.CreateCampaign)
			campaigns_private.POST("/create-active", campaignHandler.CreateAndActiveCampaign)
			campaigns_private.PUT("/:id", campaignHandler.UpdateCampaign)
			campaigns_private.PATCH("/:id/activate", campaignHandler.ActivateCampaign)
			campaigns_private.PATCH("/:id/close", campaignHandler.CloseCampaign)
			campaigns_private.DELETE("/:id", campaignHandler.DeleteDraftCampaign)
		}

		// Campaign routes (public)
		campaigns_public := v1.Group("/campaigns")
		{
			campaigns_public.GET("", campaignHandler.ListCampaigns)
			campaigns_public.GET("/slug/:slug", campaignHandler.GetCampaignBySlug)
			campaigns_public.GET("/:id", campaignHandler.GetCampaign)
			campaigns_public.GET("/:id/top-contributors", campaignHandler.GetTopContributors)
			campaigns_public.POST("/:id/sync", statsHandler.SyncCampaign)
		}

		stats_public := v1.Group("/stats")
		{
			stats_public.GET("/campaign", statsHandler.GetCampaignStats)
		}

		redEnvelope_private := v1.Group("/red-envelopes")
		{
			redEnvelope_private.Use(middleware.Authentication(cfg.JWT.Secret))
			redEnvelope_private.POST("/create", redEnvelopeHandler.CreateRedEnvelope)
			redEnvelope_private.GET("/stats", redEnvelopeHandler.GetRedEnvelopeStats)
			redEnvelope_private.GET("/:id", redEnvelopeHandler.GetRedEnvelopeClaim)
			redEnvelope_private.POST("/update-status-red-envelope", redEnvelopeHandler.UpdateStatusRedEnvelope)
			redEnvelope_private.GET("/claimed-by-wallet", redEnvelopeHandler.GetRedEnvelopeClaimByWallet)
			redEnvelope_private.GET("/created-by-wallet", redEnvelopeHandler.GetRedEnvelopeCreatedByWallet)
			redEnvelope_private.POST("/detail", redEnvelopeHandler.GetDetailRedEnvelopeById)
			redEnvelope_private.POST("/close-session", redEnvelopeHandler.CloseSessionRedEnvelope)
		}
	}
}
