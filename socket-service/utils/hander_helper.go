package utils

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
    "crypto/sha256"
	"github.com/mr-tron/base58/base58"
)


func GetUserAddressFromContext(c *gin.Context) (string, error) {
	user, ok := c.Get("user")
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}

	userID, ok := user.(jwt.MapClaims)["user_id"].(string)
	userAddress := GenerateAddress(userID)
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}

	fmt.Println("userAddress", userAddress)
	return userAddress, nil
}

func GenerateAddress(input string) string {
	sum := sha256.Sum256([]byte(input))
	return base58.Encode(sum[:])
}