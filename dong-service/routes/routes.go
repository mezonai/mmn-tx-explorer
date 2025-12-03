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
	"dong-service/services"

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

	queueService := repository.NewRedEnvelopeQueueService(database.RedisClient)
	intermediaryWalletRepo := repository.NewIntermediaryWalletRepository(database.GetDB(), cfg.Database.Schema)
	redEnvelopeRepo := repository.NewRedEnvelopeRepository(database.GetDB(), cfg.Database.Schema, blockchainService, intermediaryWalletRepo, queueService)
	redEnvelopeHandler := handlers.NewRedEnvelopeHandler(redEnvelopeRepo, queueService, intermediaryWalletRepo)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Initialize repositories
		campaignRepo := repository.NewDonationCampaignRepository(database.GetDB(), cfg.Database.Schema, cfg.Indexer.Schema)
		statsRepo := repository.NewCampaignStatisticsRepository(database.GetDB(), cfg.Indexer.Schema, cfg.Database.Schema, cfg.Scheduler.RecentStatsWindowDays)
		walletRepo := repository.NewWalletRepository(database.GetDB(), cfg.Indexer.Schema)

		// Initialize handlers
		campaignHandler := handlers.NewDonationCampaignHandler(campaignRepo)
		statsHandler := handlers.NewCampaignStatisticsHandler(statsRepo)
		walletHandler := handlers.NewWalletHandler(walletRepo, campaignRepo)

		// Offers - new trading endpoints (previously named Orders)
		offerRepo := repository.NewOfferRepository(database.GetDB(), cfg.Database.Schema)
		offerService := services.NewOfferService(offerRepo, intermediaryWalletRepo)
		offerHandler := handlers.NewOfferHandler(offerService)

		// Campaign routes (protected)
		campaignsPrivate := v1.Group("/admin/campaigns")
		campaignsPrivate.Use(middleware.Authentication(cfg.JWT.Secret))
		campaignsPrivate.POST("", campaignHandler.CreateCampaign)
		campaignsPrivate.POST("/create-active", campaignHandler.CreateAndActiveCampaign)
		campaignsPrivate.PUT("/:id", campaignHandler.UpdateCampaign)
		campaignsPrivate.PATCH("/:id/activate", campaignHandler.ActivateCampaign)
		campaignsPrivate.PATCH("/:id/close", campaignHandler.CloseCampaign)
		campaignsPrivate.DELETE("/:id", campaignHandler.DeleteDraftCampaign)

		// Campaign routes (public)
		campaignsPublic := v1.Group("/campaigns")
		campaignsPublic.GET("", campaignHandler.ListCampaigns)
		campaignsPublic.GET("/slug/:slug", campaignHandler.GetCampaignBySlug)
		campaignsPublic.GET("/:id", campaignHandler.GetCampaign)
		campaignsPublic.GET("/:id/top-contributors", campaignHandler.GetTopContributors)
		campaignsPublic.POST("/:id/sync", statsHandler.SyncCampaign)

		// Statistics routes (public)
		statsPublic := v1.Group("/stats")
		statsPublic.GET("/campaign", statsHandler.GetCampaignStats)

		// Red Envelope routes (private)
		redEnvelopePrivate := v1.Group("/red-envelopes")
		redEnvelopePrivate.Use(middleware.Authentication(cfg.JWT.Secret))
		redEnvelopePrivate.POST("/create", redEnvelopeHandler.CreateRedEnvelope)
		redEnvelopePrivate.GET("/stats", redEnvelopeHandler.GetRedEnvelopeStats)
		redEnvelopePrivate.GET("/:id/recipients", redEnvelopeHandler.GetRecipientsByRedEnvelopeID)
		redEnvelopePrivate.POST("/update-status-red-envelope", redEnvelopeHandler.UpdateStatusRedEnvelope)
		redEnvelopePrivate.GET("/claimed-by-user", redEnvelopeHandler.GetRedEnvelopeClaimedByUser)
		redEnvelopePrivate.GET("/created-by-user", redEnvelopeHandler.GetRedEnvelopeCreatedByUser)
		redEnvelopePrivate.GET("/detail/:id", redEnvelopeHandler.GetDetailRedEnvelopeByID)
		redEnvelopePrivate.POST("/close-session", redEnvelopeHandler.CloseSessionRedEnvelope)
		redEnvelopePrivate.GET("/claim-amount", redEnvelopeHandler.ClaimAmountRedEnvelope)
		redEnvelopePrivate.POST("/:id/claim", redEnvelopeHandler.ClaimRedEnvelope)

		// Wallet routes (public)
		walletPublic := v1.Group("/wallets")
		walletPublic.Use(middleware.ParseTokenAndAddToContext(cfg.JWT.Secret))
		walletPublic.GET("/:address/detail", walletHandler.GetWalletDetail)

		// Offers (private) - create offer
		offersPrivate := v1.Group("/offers")
		offersPrivate.Use(middleware.Authentication(cfg.JWT.Secret))
		offersPrivate.GET("", offerHandler.ListOffers)
		offersPrivate.GET("/:id", offerHandler.GetOfferDetail)
		offersPrivate.POST("", offerHandler.CreateOffer)
		offersPrivate.POST("/:id/confirm", offerHandler.ConfirmOffer)
	}
}
