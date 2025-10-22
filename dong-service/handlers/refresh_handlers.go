package handlers

import (
	"dong-service/config"
	"dong-service/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	UserID       string `json:"user_id"`
}



// RefreshHandler godoc
// @Summary Refresh access token
// @Description Validate refresh token, rotate token ID, issue new access/refresh tokens, and update Redis whitelist. Returns new JWT tokens.
// @Tags Auth
// @Accept json
// @Produce json
// @Param RefreshRequest body RefreshRequest true "Refresh token to validate"
// @Success 200 {object} RefreshResponse "New JWT tokens"
// @Failure 400 {object} map[string]string "Missing or invalid refresh token"
// @Failure 401 {object} map[string]string "Unauthorized or token not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /refresh [post]
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token!"})
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

	oldTokenID, _ := claims["token_id"].(string)

	exists, _, err := database.Get(oldTokenID)
	if err != nil || !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token not found on whitelist"})
		return
	}

	if err := database.Delete(oldTokenID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete old refresh token"})
		return
	}

	newTokenID := uuid.NewString()
	accessClaims := jwt.MapClaims{
		"token_id": newTokenID,
		"user_id":  userID,
		"type":     "access",
		"exp":      time.Now().Add(time.Duration(config.Cfg.JWT.Access_Exp) * time.Second).Unix(),
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
		"exp":      time.Now().Add(time.Duration(config.Cfg.JWT.Refresh_Exp) * time.Second).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefresh, err := refreshToken.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign refresh token"})
		return
	}

	tokenTTL := time.Duration(config.Cfg.JWT.Refresh_Exp) * time.Second

	if err := database.Set(newTokenID, userID, tokenTTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store new refresh token"})
		return
	}

	c.JSON(http.StatusOK, RefreshResponse{
		AccessToken:  signedAccess,
		RefreshToken: signedRefresh,
		UserID:       userID,
	})
}
