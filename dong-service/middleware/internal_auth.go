package middleware

import (
	"net/http"

	"dong-service/models"

	"github.com/gin-gonic/gin"
)

// InternalAuth returns a middleware that validates an internal API Key
func InternalAuth(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if apiKey == "" {
			c.AbortWithStatusJSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Internal API Key not configured"))
			return
		}

		requestKey := c.GetHeader("X-Internal-API-Key")
		if requestKey == "" {
			requestKey = c.Query("api_key")
		}

		if requestKey != apiKey {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "Invalid internal API Key"))
			return
		}

		c.Next()
	}
}
