package middleware

import (
	"dong-service/config"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS(corsConfig *config.CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if origin is in allowed domains list
		origin := c.GetHeader("Origin")
		if origin != "" && len(corsConfig.AllowedDomains) > 0 {
			for _, allowedDomain := range corsConfig.AllowedDomains {
				if strings.TrimSuffix(origin, "/") == strings.TrimSuffix(allowedDomain, "/") {
					c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
					break
				}
			}
		} else if len(corsConfig.AllowedDomains) == 0 {
			c.Writer.Header().Set("Access-Control-Allow-Origin", corsConfig.AllowOrigins)
		}

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
