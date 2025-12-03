package routers

import (
	"socket-service/config"
	"socket-service/database"
	"socket-service/handlers"
	"socket-service/repository"
    "socket-service/service"
	"github.com/gin-gonic/gin"
)


func SetupRouters(router *gin.Engine, cfg *config.Config) {

    WSService := service.NewWSService()
	eventRepo := repository.NewEventRepository(database.GetDB(), cfg.Database.Schema)
	httpHandler := handlers.NewHTTPHandler(eventRepo, cfg, WSService)
	wsHandler := handlers.NewWSHandler(eventRepo, cfg, WSService)
  
	router.POST("/event", httpHandler.SaveEvent)

	router.GET("/ws", wsHandler.HandleWS)
}
