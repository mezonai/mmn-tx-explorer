package middleware

import (
	"dong-service/config"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS(corsConfig *config.CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowedOrigin := ""
		if origin != "" {
			for _, allowedOriginCfg := range corsConfig.AllowOrigins {
				if strings.EqualFold(origin, allowedOriginCfg) {
					allowedOrigin = origin
					break
				}
			}
		}

		if allowedOrigin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", strconv.FormatBool(corsConfig.AllowCreds))
			c.Writer.Header().Set("Access-Control-Allow-Headers", corsConfig.AllowHeaders)
			c.Writer.Header().Set("Access-Control-Allow-Methods", corsConfig.AllowMethods)
		}

		if c.Request.Method == "OPTIONS" {
			if allowedOrigin != "" {
				c.AbortWithStatus(204)
			} else {
				c.AbortWithStatus(403)
			}
			return
		}

		if allowedOrigin != "" || origin == "" {
			c.Next()
		} else {
			c.AbortWithStatus(403)
		}
	}
}
