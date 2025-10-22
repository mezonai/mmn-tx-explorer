package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"dong-service/config"
	"dong-service/database"
)

func Authentication(c *gin.Context) {

	tokenString := ""
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	}

	if tokenString == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid token"})
		return
	}

	secret := config.Cfg.JWT.Secret
	if secret == "" {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "JWT secret not configured"})
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired access token"})
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {

		if t, _ := claims["type"].(string); t != "access" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token is not an access token"})
			return
		}

		tokenID, _ := claims["token_id"].(string)
		if tokenID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token_id in token"})
			return
		}
		ok, _, err := database.Get(tokenID)
		if err != nil || !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "access token not whitelisted"})
			return
		}
		c.Set("user", claims)
	}

	c.Next()
}