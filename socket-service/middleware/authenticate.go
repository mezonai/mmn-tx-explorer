package middleware

import (
	"net/http"
	"socket-service/database"
	"socket-service/logger"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func ValidateToken(jwtSecret string) gin.HandlerFunc {
       return func(c *gin.Context) {
	       tokenString := c.Query("token")
	       if tokenString == "" {
			   logger.Error().Msg("Missing token in query param")
		       c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
			   return 
	       }
	       if jwtSecret == "" {
			   	logger.Error().Msg("JWT secret not configured")
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "JWT secret not configured"})
				return
			}
	       token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		       if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			       return nil, jwt.ErrSignatureInvalid
		       }
		       return []byte(jwtSecret), nil
	       })
	       if err != nil {
			   logger.Error().Err(err).Msg("Invalid token")	
		       c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			   return
	       }
	       claims, ok := token.Claims.(jwt.MapClaims)
	       if !ok || !token.Valid {
			   logger.Error().Msg("Invalid claims in token")
		       c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid claims"})
			   return
	       }

	       tokenType, _ := claims["type"].(string)
	       if tokenType != "access" {
			   logger.Error().Msg("Token is not an access token")
		       c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is not an access token"})
		       return
	       }
	       tokenID, _ := claims["token_id"].(string)
	       if tokenID == "" {
			   logger.Error().Msg("Token is missing token_id")
		       c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is missing token_id"})
		       return
	       }
		   ok, _, err = database.Get(tokenID)
	       if err != nil {
			   logger.Error().Err(err).Msg("Error checking whitelist")
		       c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Error checking whitelist"})
		       return
	       }
	       if !ok {
			   logger.Error().Msg("Token is not in whitelist")
		       c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is not in whitelist"})
		       return
	       }
	       c.Set("user", claims)
	       c.Next()
       }
}

func ValidateAPIKey(expectedKey string) gin.HandlerFunc {
       return func(c *gin.Context) {
	       apiKey := c.GetHeader("X-API-Key")
	       if apiKey == "" || expectedKey == "" || apiKey != expectedKey {
			   logger.Error().Msg("Invalid or missing API Key")
		       c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or missing API Key"})
		       return
	       }
	       c.Next()
       }
}
