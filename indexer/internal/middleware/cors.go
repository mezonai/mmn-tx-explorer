package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
)

func NewCORS() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     config.Cfg.CORS.AllowedOrigins,
		AllowMethods:     config.Cfg.CORS.AllowMethods,
		AllowHeaders:     config.Cfg.CORS.AllowHeaders,
		AllowCredentials: config.Cfg.CORS.AllowCreds,
	})
}
