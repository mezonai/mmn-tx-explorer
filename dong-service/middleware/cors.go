package middleware

import (
	"dong-service/config"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CORS(corsConfig *config.CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Credentials", strconv.FormatBool(corsConfig.AllowCreds))
		c.Writer.Header().Set("Access-Control-Allow-Headers", corsConfig.AllowHeaders)
		c.Writer.Header().Set("Access-Control-Allow-Methods", corsConfig.AllowMethods)

		if c.Request.Method == "GET" {
			path := c.FullPath()
			if path == "/health" ||
				path == "/api/v1/stats/campaign" ||
				path == "/api/v1/campaigns/:id" ||
				path == "/api/v1/campaigns" ||
				path == "/api/v1/campaigns/:id/top-contributors" ||
				path == "/api/v1/campaigns/slug/:slug" ||
				path == "/api/v1/wallets/:address/detail" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", corsConfig.AllowOrigins)
			}
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
