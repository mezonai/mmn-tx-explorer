package middleware

import (
	"dong-service/config"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CORS(corsConfig *config.CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", corsConfig.AllowOrigins)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", strconv.FormatBool(corsConfig.AllowCreds))
		c.Writer.Header().Set("Access-Control-Allow-Headers", corsConfig.AllowHeaders)
		c.Writer.Header().Set("Access-Control-Allow-Methods", corsConfig.AllowMethods)

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
