package middleware

import (
	"socket-service/logger"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(startTime)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()
		bodySize := c.Writer.Size()

		if raw != "" {
			path = path + "?" + raw
		}

		// Log with structured fields
		logEvent := logger.Info().
			Str("client_ip", clientIP).
			Str("method", method).
			Str("path", path).
			Int("status", statusCode).
			Int("body_size", bodySize).
			Dur("latency", latency).
			Str("user_agent", c.Request.UserAgent())

		// Add error message if present
		if errorMessage != "" {
			logEvent = logEvent.Str("error", errorMessage)
		}

		// Add user_id if authenticated
		if userID, exists := c.Get("user_id"); exists {
			logEvent = logEvent.Str("user_id", userID.(string))
		}

		// Log based on status code
		switch {
		case statusCode >= 500:
			logEvent.Msg("Server error")

		case statusCode >= 400:
			logEvent.Msg("Client error")

		default:
			logEvent.Msg("Request completed")
		}
	}
}