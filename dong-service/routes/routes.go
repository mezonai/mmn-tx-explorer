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
		campaignFeedRepo := repository.NewDonationCampaignFeedRepository(database.GetDB(), cfg.Database.Schema)

		// Initialize handlers
		campaignHandler := handlers.NewDonationCampaignHandler(campaignRepo)
		statsHandler := handlers.NewCampaignStatisticsHandler(statsRepo)
		walletHandler := handlers.NewWalletHandler(walletRepo, campaignRepo)
		campaignFeedHandler := handlers.NewDonationCampaignFeedHandler(campaignFeedRepo, campaignRepo, cfg)

		// Campaign routes (protected)
		campaignsPrivate := v1.Group("/admin/campaigns")
		campaignsPrivate.Use(middleware.Authentication(cfg.JWT.Secret))
		campaignsPrivate.POST("", campaignHandler.CreateCampaign)
		campaignsPrivate.POST("/create-active", campaignHandler.CreateAndActiveCampaign)
		campaignsPrivate.PUT("/:id", campaignHandler.UpdateCampaign)
		campaignsPrivate.PATCH("/:id/activate", campaignHandler.ActivateCampaign)
		campaignsPrivate.PATCH("/:id/close", campaignHandler.CloseCampaign)
		campaignsPrivate.DELETE("/:id", campaignHandler.DeleteDraftCampaign)
		campaignsPrivate.POST("/upload-image", campaignFeedHandler.UploadImage)

		// Campaign routes (public)
		campaignsPublic := v1.Group("/campaigns")
		campaignsPublic.GET("", campaignHandler.ListCampaigns)
		campaignsPublic.GET("/slug/:slug", campaignHandler.GetCampaignBySlug)
		campaignsPublic.GET("/:id", campaignHandler.GetCampaign)
		campaignsPublic.GET("/:id/top-contributors", campaignHandler.GetTopContributors)
		campaignsPublic.POST("/:id/sync", statsHandler.SyncCampaign)
		campaignsPublic.GET("/list-feed/:campaign_address", middleware.ParseTokenAndAddToContext(cfg.JWT.Secret), campaignFeedHandler.ListCampaignFeedsByAddress)
		campaignsPublic.GET("/list-history-feed/:root_feed_hash", campaignFeedHandler.ListHistoryFeedsByRootHash)
		campaignsPublic.PATCH("/update-visible-feed/:root_feed_hash", middleware.Authentication(cfg.JWT.Secret), campaignFeedHandler.UpdateVisibleFeed)
		campaignsPublic.GET("/feed_detail/:feed_hash", campaignFeedHandler.GetFeedDetailByHash)

		// Statistics routes (public)
		statsPublic := v1.Group("/stats")
		statsPublic.GET("/campaign", statsHandler.GetCampaignStats)

		// Red Envelope routes (private)
		redEnvelopePrivate := v1.Group("/red-envelopes")
		redEnvelopePrivate.Use(middleware.Authentication(cfg.JWT.Secret))
		redEnvelopePrivate.POST("/create", redEnvelopeHandler.CreateRedEnvelope)
		redEnvelopePrivate.GET("/stats-by-user", redEnvelopeHandler.GetRedEnvelopeStatsByUser)
		redEnvelopePrivate.GET("/:id/recipients", redEnvelopeHandler.GetRecipientsByRedEnvelopeID)
		redEnvelopePrivate.POST("/update-status-red-envelope", redEnvelopeHandler.UpdateStatusRedEnvelope)
		redEnvelopePrivate.GET("/claimed-by-user", redEnvelopeHandler.GetRedEnvelopeClaimedByUser)
		redEnvelopePrivate.GET("/created-by-user", redEnvelopeHandler.GetRedEnvelopeCreatedByUser)
		redEnvelopePrivate.GET("/detail/:id", redEnvelopeHandler.GetDetailRedEnvelopeByID)
		redEnvelopePrivate.POST("/close-session", redEnvelopeHandler.CloseSessionRedEnvelope)
		redEnvelopePrivate.GET("/claim-amount", redEnvelopeHandler.ClaimAmountRedEnvelope)
		redEnvelopePrivate.POST("/:id/claim", redEnvelopeHandler.ClaimRedEnvelope)

		// Red Envelope routes (public)
		redEnvelopePublic := v1.Group("/red-envelopes")
		redEnvelopePublic.GET("/stats", redEnvelopeHandler.GetRedEnvelopeStats)

		// Wallet routes (public)
		walletPublic := v1.Group("/wallets")
		walletPublic.Use(middleware.ParseTokenAndAddToContext(cfg.JWT.Secret))
		walletPublic.GET("/:address/detail", walletHandler.GetWalletDetail)

		// Offers (private) - create offer
		offersPrivate := v1.Group("/offers")
		offersPrivate.Use(middleware.Authentication(cfg.JWT.Secret))

		offerRepo := repository.NewOfferRepository(database.GetDB(), cfg.Database.Schema)
		orderRepo := repository.NewOrderRepository(database.GetDB(), cfg.Database.Schema)
		userPaymentRepo := repository.NewUserPaymentInfoRepository(database.GetDB(), cfg.Database.Schema)

		userPaymentService := services.NewUserPaymentService(userPaymentRepo)
		userPaymentHandler := handlers.NewUserPaymentHandler(userPaymentService)

		offerService := services.NewOfferService(offerRepo, intermediaryWalletRepo, walletRepo, orderRepo, blockchainService, userPaymentRepo)
		orderService := services.NewOrderService(orderRepo, offerRepo, intermediaryWalletRepo, blockchainService, offerService)

		offerService.SetOrderService(orderService)

		offerHandler := handlers.NewOfferHandler(offerService)
		orderHandler := handlers.NewOrderHandler(orderService, offerService)

		offersPrivate.POST("", offerHandler.CreateOffer)
		offersPrivate.GET("/me", offerHandler.GetMyOffers)
		offersPrivate.GET("/:id", offerHandler.GetOfferDetail)
		offersPrivate.GET("/:id/orders", orderHandler.ListOrdersForOffer)
		offersPrivate.POST("/:id/orders", orderHandler.CreateOrder)
		offersPrivate.PATCH("/:id/cancel", offerHandler.CancelOffer)

		// User Payments (private)
		userPayments := v1.Group("/user-payments")
		userPayments.Use(middleware.Authentication(cfg.JWT.Secret))
		userPayments.POST("", userPaymentHandler.UpdatePaymentInfo)
		userPayments.GET("/me", userPaymentHandler.GetMyPaymentInfos)
		userPayments.DELETE("/:id", userPaymentHandler.DeletePaymentInfo)

		// Offers (public)
		offersPublic := v1.Group("/offers")
		offersPublic.GET("", offerHandler.ListOffers)

		orders := v1.Group("/orders")
		orders.Use(middleware.Authentication(cfg.JWT.Secret))
		orders.POST("/:id/confirm", orderHandler.ConfirmOrder)
		orders.GET("/me", orderHandler.GetMyOrders)
		orders.GET("/:id", orderHandler.GetOrderDetail)
	}
}
