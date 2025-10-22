package handlers

import (
	"dong-service/config"
	"dong-service/database"
	"net/http"
	"dong-service/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// LogoutHandler godoc
// @Summary Logout and revoke refresh token
// @Description Invalidate the provided refresh token and remove it from Redis whitelist. Always returns HTTP 200 with different message responses:
// @Tags Auth
// @Accept json
// @Produce json
// @Param LogoutRequest body LogoutRequest true "Refresh token to revoke"
// @Success 200 models.Response "Logout status message (see Description for possible values)"
// @Router /logout [post]
func LogoutHandler(c *gin.Context) {
	var req LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "Logout successful but token invalid: missing refresh_token",
			Data:    nil,
		})
		return
	}

	secret := config.Cfg.JWT.Secret
	if secret == "" {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "Logout successful but token invalid: jwt secret not configured",
			Data:    nil,
		})
		return
	}

	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "Logout successful but token invalid: invalid refresh token",
			Data:    nil,
		})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "Logout successful but token invalid: invalid claims",
			Data:    nil,
		})
		return
	}

	if t, _ := claims["type"].(string); t != "refresh" {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "Logout successful but token invalid: token is not a refresh token",
			Data:    nil,
		})
		return
	}

	oldTokenID, _ := claims["token_id"].(string)

	exists, _, err := database.Get(oldTokenID)
	if err != nil || !exists {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "Logout successful but token invalid: token ID not found in whitelist",
			Data:    nil,
		})
		return
	}

	if err := database.Delete(oldTokenID); err != nil {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "Logout successful but token invalid: failed to delete refresh token",
			Data:   nil,
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    http.StatusOK,
		Message: "Logout successful, token deleted from whitelist",
		Data:    nil,
	})
}
