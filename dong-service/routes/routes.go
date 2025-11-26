package routes

import (
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

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Initialize repositories
		campaignRepo := repository.NewDonationCampaignRepository(database.GetDB(), cfg.Database.Schema, cfg.Indexer.Schema)
		statsRepo := repository.NewCampaignStatisticsRepository(database.GetDB(), cfg.Indexer.Schema, cfg.Database.Schema)
		walletRepo := repository.NewWalletRepository(database.GetDB(), cfg.Indexer.Schema)

		// Initialize handlers
		campaignHandler := handlers.NewDonationCampaignHandler(campaignRepo)
		statsHandler := handlers.NewCampaignStatisticsHandler(statsRepo)
		walletHandler := handlers.NewWalletHandler(walletRepo, campaignRepo)

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

		// Wallet routes (public)
		walletPublic := v1.Group("/wallets")
		walletPublic.Use(middleware.ParseTokenAndAddToContext(cfg.JWT.Secret))
		walletPublic.GET("/:address/detail", walletHandler.GetWalletDetail)
	}
}
