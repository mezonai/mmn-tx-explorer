package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	config "github.com/thirdweb-dev/indexer/configs"
)

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	UserID       string `json:"user_id"`
}


func RefreshHandler(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing refresh_token"})
		return
	}

	secret := config.Cfg.JWT.Secret
	if secret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "jwt secret not configured"})
		return
	}

	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid claims"})
		return
	}


	if t, _ := claims["type"].(string); t != "refresh" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token is not a refresh token"})
		return
	}

	userID, _ := claims["user_id"].(string)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token (missing user_id)"})
		return
	}

	newTokenID := uuid.NewString()
	accessClaims := jwt.MapClaims{
		"token_id": newTokenID,
		"user_id":  userID,
		"type":     "access",
		"exp":      time.Now().Add(15 * time.Minute).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	signedAccess, err := accessToken.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign access token"})
		return
	}

	refreshClaims := jwt.MapClaims{
		"token_id": newTokenID,
		"user_id":  userID,
		"type":     "refresh",
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefresh, err := refreshToken.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign refresh token"})
		return
	}

	c.JSON(http.StatusOK, TokenResponse{
		AccessToken:  signedAccess,
		RefreshToken: signedRefresh,
		UserID:       userID,
	})
}
