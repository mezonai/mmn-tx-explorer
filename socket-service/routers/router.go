package routers

import (
	"socket-service/config"
	"socket-service/database"
	"socket-service/handlers"
	"socket-service/repository"
    "socket-service/service"
	"socket-service/middleware"
	"github.com/gin-gonic/gin"
)


func SetupRouters(router *gin.Engine, cfg *config.Config) {

    WSService := service.NewWSService()
	eventRepo := repository.NewEventRepository(database.GetDB(), cfg.Database.Schema)
	httpHandler := handlers.NewHTTPHandler(eventRepo, cfg, WSService)
	wsHandler := handlers.NewWSHandler(eventRepo, cfg, WSService)
    tokenMiddleware := middleware.ValidateToken(cfg.JWT.Secret)
	apikeyMiddleware := middleware.ValidateAPIKey(cfg.JWT.APIKey)

	ws := router.Group("/ws")
	ws.Use(tokenMiddleware)
	ws.GET("/connect", wsHandler.HandleWS)
     
	http := router.Group("/api")
	http.Use(apikeyMiddleware)
	http.POST("/event", httpHandler.SaveEvent)
	
}
