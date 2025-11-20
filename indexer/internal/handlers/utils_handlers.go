package handlers

import (
	"crypto/sha256"
	"net/http"
	"strings"

	"github.com/btcsuite/btcutil/base58"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
)

func sendJSONResponse(c *gin.Context, response interface{}) {
	c.JSON(http.StatusOK, response)
}

//generates a wallet address from user ID 
func GenerateAddress(input string) string {
	sum := sha256.Sum256([]byte(input))
	return base58.Encode(sum[:])
}

//extracts user_id from JWT token in Authorization header
func GetUserIDFromJWT(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}

	tokenString, found := strings.CutPrefix(authHeader, "Bearer ")
	if !found {
		return ""
	}
	tokenString = strings.TrimSpace(tokenString)

	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
	if err != nil {
		log.Debug().Err(err).Msg("Failed to parse JWT token")
		return ""
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return ""
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return ""
	}

	return userID
}
