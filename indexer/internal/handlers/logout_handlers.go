package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	config "github.com/thirdweb-dev/indexer/configs"
	"github.com/thirdweb-dev/indexer/internal/storage"
)

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func LogoutHandler(c *gin.Context) {
	var req LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Logout successful but token invalid: missing refresh_token"})
		return
	}

	secret := config.Cfg.JWT.Secret
	if secret == "" {
		c.JSON(http.StatusOK, gin.H{"message": "Logout successful but token invalid: jwt secret not configured"})
		return
	}

	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusOK, gin.H{"message": "Logout successful but token invalid: invalid refresh token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"message": "Logout successful but token invalid: invalid claims"})
		return
	}

	if t, _ := claims["type"].(string); t != "refresh" {
		c.JSON(http.StatusOK, gin.H{"message": "Logout successful but token invalid: token is not a refresh token"})
		return
	}

	oldTokenID, _ := claims["token_id"].(string)


	exists, _, err := storage.Get(oldTokenID)
	if err != nil || !exists {
		c.JSON(http.StatusOK, gin.H{"message": "Logout successful but token invalid: token ID not found in whitelist"})
		return
	}


	if err := storage.Delete(oldTokenID); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Logout successful but token invalid: failed to delete refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logout successful, token deleted from whitelist"})
}
