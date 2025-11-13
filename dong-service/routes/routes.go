package routes

import (
	"dong-service/blockchain"
	"dong-service/config"
	"dong-service/database"
	_ "dong-service/docs" // Import docs to load swagger documentation
	"dong-service/handlers"
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

	blockchainService := blockchain.GetBlockchainService()
	walletRepo := repository.NewRedEnvelopeWalletRepository(database.GetDB())

	// Initialize Redis queue service
	queueService := repository.NewRedEnvelopeQueueService(database.RedisClient)

	redEnvelopeRepo := repository.NewRedEnvelopeRepository(database.GetDB(), cfg.Database.Schema, blockchainService, walletRepo)

	// Set queue service to repository (to avoid circular dependency)
	redEnvelopeRepo.SetQueueService(queueService)

	redEnvelopeHandler := handlers.NewRedEnvelopeHandler(redEnvelopeRepo, queueService)

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
			redEnvelope_private.POST("", redEnvelopeHandler.CreateRedEnvelope)
			redEnvelope_private.GET("/claim-amount/:id", redEnvelopeHandler.ClaimAmountRedEnvelope)
			redEnvelope_private.POST("/:id/claim", redEnvelopeHandler.ClaimRedEnvelope)
			// redEnvelope_private.POST("/close-session", redEnvelopeHandler.CloseSessionRedEnvelope)
		}

		redEnvelope_public := v1.Group("/red-envelopes")
		{
			redEnvelope_public.GET("/stats", redEnvelopeHandler.GetRedEnvelopeStats)
			redEnvelope_public.GET("/:id", redEnvelopeHandler.GetRedEnvelopeClaim)
			redEnvelope_public.POST("/update-status-red-envelope", redEnvelopeHandler.UpdateStatusRedEnvelope)
			redEnvelope_public.GET("/claimed-by-wallet", redEnvelopeHandler.GetRedEnvelopeClaimByWallet)
			redEnvelope_public.GET("/created-by-wallet", redEnvelopeHandler.GetRedEnvelopeCreateByWallet)
			redEnvelope_public.POST("/detail", redEnvelopeHandler.GetDetailRedEnvelopeById)
			redEnvelope_public.POST("/close-session", redEnvelopeHandler.CloseSessionRedEnvelope)
			// redEnvelope_public.POST("/:id/claim-amount", redEnvelopeHandler.ClaimAmountRedEnvelope)
			// redEnvelope_public.POST("/:id/claim", redEnvelopeHandler.ClaimRedEnvelope)
		}
	}
}
