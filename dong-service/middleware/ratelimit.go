package middleware

import (
	"dong-service/config"
	"dong-service/logger"
	"dong-service/models"
	"net/http"
	"sync"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

var ipLimiters sync.Map

func getIPLimiter(ip string, cfg *config.Config) *rate.Limiter {
	limiterIface, ok := ipLimiters.Load(ip)
	if ok {
		return limiterIface.(*rate.Limiter)
	}
	limiter := rate.NewLimiter(rate.Limit(cfg.RateLimit.IPRateLimitPerSec), cfg.RateLimit.IPRateLimitBurst)
	ipLimiters.Store(ip, limiter)
	return limiter
}

func RateLimitMiddleware(cfg *config.Config) gin.HandlerFunc {

	return func(c *gin.Context) {
		ip := c.ClientIP()
		ipLimiter := getIPLimiter(ip, cfg)
		if !ipLimiter.Allow() {
			logger.Warn().Str("ip", ip).Msg("Rate limit exceeded")
			c.JSON(http.StatusTooManyRequests, models.ErrorResponse(http.StatusTooManyRequests, "Too many requests from your IP"))
			c.Abort()
			return
		}
		c.Next()
	}
}