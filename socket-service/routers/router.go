package routers

import (
	"socket-service/config"
	"socket-service/database"
	"socket-service/handlers"
	"socket-service/middleware"
	"socket-service/repository"
	"socket-service/service"

	"github.com/gin-gonic/gin"
)

func SetupRouters(router *gin.Engine, cfg *config.Config) {

	WSService := service.NewWSService()
	eventRepo := repository.NewEventRepository(database.GetDB(), cfg.Database.Schema)
	httpHandler := handlers.NewHTTPHandler(eventRepo, cfg, WSService)
	wsHandler := handlers.NewWSHandler(eventRepo, cfg, WSService)
	tokenMiddleware := middleware.ValidateToken(cfg.JWT.Secret)
	apikeyMiddleware := middleware.ValidateAPIKey(cfg.JWT.APIKey)

	// public WS endpoint for frontend clients (authenticated with JWT)
	ws := router.Group("/ws")
	ws.Use(tokenMiddleware)
	ws.GET("/connect", wsHandler.HandleWS)

	// publisher WS endpoint for backend services (authenticated with API key)
	wsProducer := router.Group("/ws")
	wsProducer.Use(apikeyMiddleware)
	wsProducer.GET("/publish", wsHandler.HandleWSPublish)

	http := router.Group("/api")
	http.Use(apikeyMiddleware)
	http.POST("/event", httpHandler.SaveEvent)

}
