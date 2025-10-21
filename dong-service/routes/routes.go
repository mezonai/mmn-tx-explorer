package routes

import (
	"dong-service/database"
	_ "dong-service/docs" // Import docs to load swagger documentation
	"dong-service/handlers"
	"dong-service/repository"

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

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Initialize repositories
		campaignRepo := repository.NewDonationCampaignRepository(database.GetDB())

		// Initialize handlers
		campaignHandler := handlers.NewDonationCampaignHandler(campaignRepo)

		// Campaign routes
		campaigns := v1.Group("/campaigns")
		{
			campaigns.POST("", campaignHandler.CreateCampaign)
			campaigns.GET("", campaignHandler.ListCampaigns)
			campaigns.GET("/:id", campaignHandler.GetCampaign)
			campaigns.PUT("/:id", campaignHandler.UpdateCampaign)
			campaigns.PATCH("/:id/activate", campaignHandler.ActivateCampaign)
			campaigns.PATCH("/:id/close", campaignHandler.CloseCampaign)
		}
	}
}
