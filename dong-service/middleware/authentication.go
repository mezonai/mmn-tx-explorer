package middleware

import (
	"net/http"
	"strings"

	"dong-service/constants"
	"dong-service/database"
	"dong-service/logger"
	"dong-service/models"
	"dong-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Authentication returns a middleware that validates JWT tokens and checks whitelist
func Authentication(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractBearerToken(c)
		if tokenString == "" {
			abortWithError(c, http.StatusUnauthorized, constants.ErrInvalidToken)
			return
		}

		if jwtSecret == "" {
			abortWithError(c, http.StatusInternalServerError, "JWT secret not configured")
			return
		}

		token, err := parseToken(tokenString, jwtSecret)
		if err != nil {
			abortWithError(c, http.StatusUnauthorized, constants.ErrInvalidToken)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			abortWithError(c, http.StatusUnauthorized, constants.ErrInvalidToken)
			return
		}

		if err := validateClaims(claims); err != nil {
			abortWithError(c, http.StatusUnauthorized, err.Error())
			return
		}

		c.Set("user", claims)
		if userIdStr, ok := claims["user_id"].(string); ok {
			c.Set("user_id", userIdStr)
			address := utils.GenerateAddress(userIdStr)
			c.Set("address", address)
		}
		c.Next()
	}
}

// extractBearerToken extracts the token from the Authorization header
func extractBearerToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	token, found := strings.CutPrefix(authHeader, "Bearer ")
	if found {
		return token
	}
	return ""
}

// parseToken parses and validates the JWT token
func parseToken(tokenString, secret string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
}

func ParseTokenAndAddToContext(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractBearerToken(c)
		if tokenString == "" {
			return
		}

		if jwtSecret == "" {
			return
		}
		token, err := parseToken(tokenString, jwtSecret)
		if err != nil {
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return
		}
		if err := validateClaims(claims); err != nil {
			return
		}

		address := utils.GenerateAddress(claims["user_id"].(string))

		c.Set("user_id", claims["user_id"].(string))
		c.Set("address", address)
		c.Next()
	}
}

// validateClaims validates the token claims
func validateClaims(claims jwt.MapClaims) error {
	// Check token type
	tokenType, _ := claims["type"].(string)
	if tokenType != "access" {
		return jwt.ErrTokenInvalidClaims
	}

	// Check token ID
	tokenID, _ := claims["token_id"].(string)
	if tokenID == "" {
		return jwt.ErrTokenInvalidClaims
	}

	// Check whitelist
	ok, _, err := database.Get(tokenID)
	if err != nil || !ok {
		return jwt.ErrTokenInvalidClaims
	}

	return nil
}

// abortWithError aborts the request with a standardized error response
func abortWithError(c *gin.Context, statusCode int, message string) {
	c.AbortWithStatusJSON(statusCode, models.ErrorResponse(statusCode, message))
}

// InternalAuth returns a middleware that validates internal API keys
func InternalAuth(expectedKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if expectedKey == "" {
			abortWithError(c, http.StatusInternalServerError, "Internal API key not configured")
			return
		}

		key := c.GetHeader("X-Internal-Key")
		if key == "" || key != expectedKey {
			logger.Error().Str("key", key).Str("expected_key", expectedKey).Msg("Invalid internal API key")
			abortWithError(c, http.StatusUnauthorized, constants.ErrUnauthorized)
			return
		}

		c.Next()
	}
}
