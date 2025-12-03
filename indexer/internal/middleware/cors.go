package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
)

func Cors(c *gin.Context) {
	origin := c.Request.Header.Get("Origin")
	allowedOrigin := ""

	if origin != "" {
		for _, ao := range config.Cfg.API.CORS.AllowedOrigins {
			if strings.EqualFold(origin, ao) {
				allowedOrigin = origin
				break
			}
		}
	}

	if allowedOrigin != "" {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
	}

	if c.Request.Method == http.MethodOptions {
		if allowedOrigin != "" {
			c.AbortWithStatus(http.StatusNoContent)
		} else {
			c.AbortWithStatus(http.StatusForbidden)
		}
	}
	c.Next()
}
