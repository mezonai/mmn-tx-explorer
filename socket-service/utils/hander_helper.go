package utils

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)


func GetUserIDFromContext(c *gin.Context) (string, error) {
	user, ok := c.Get("user")
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}

	userID, ok := user.(jwt.MapClaims)["user_id"].(string)
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}

	fmt.Println("userID", userID)
	return userID, nil
}