package routes

import (
	"dong-service/database"
	_ "dong-service/docs" // Import docs to load swagger documentation
	"dong-service/handlers"
	"dong-service/repository"
    "dong-service/middleware"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRoutes configures all application routes
func SetupRoutes(router *gin.Engine) {

	// Health check endpoint
	healthHandler := handlers.NewHealthHandler()
	router.GET("/health", healthHandler.Health)

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

    router.POST("/oauth", handlers.OauthHandler)
	router.POST("/refresh", handlers.RefreshHandler)
	router.POST("/logout", handlers.LogoutHandler)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Initialize repositories
		campaignRepo := repository.NewDonationCampaignRepository(database.GetDB())

		// Initialize handlers
		campaignHandler := handlers.NewDonationCampaignHandler(campaignRepo)

		// Campaign routes
		campaigns_private := v1.Group("/prv_campaigns")
		{ 
		    campaigns_private.Use(middleware.Authentication)	
			campaigns_private.POST("", campaignHandler.CreateCampaign)
			campaigns_private.PUT("/:id", campaignHandler.UpdateCampaign)
			campaigns_private.PATCH("/:id/activate", campaignHandler.ActivateCampaign)
			campaigns_private.PATCH("/:id/close", campaignHandler.CloseCampaign)
		}

		campaigns_public := v1.Group("/pub_campaigns")
		{
			campaigns_public.GET("", campaignHandler.ListCampaigns)
			campaigns_public.GET("/:id", campaignHandler.GetCampaign)
		}
	}
}
