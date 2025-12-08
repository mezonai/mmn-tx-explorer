package middleware

import (
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"

    config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
)

func NewCORS() gin.HandlerFunc {
    corsCfg := cors.Config{
        AllowOrigins:     config.Cfg.API.CORS.AllowedOrigins,
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "accept", "origin", "Cache-Control", "X-Requested-With"},
        AllowCredentials: true,
    }

    return cors.New(corsCfg)
}