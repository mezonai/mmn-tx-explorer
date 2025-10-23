package handlers

import (
	"dong-service/config"
	"dong-service/constants"
	"dong-service/database"
	"dong-service/models"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AuthHandler struct {
	cfg *config.Config
}

// NewDonationCampaignHandler creates a new donation campaign handler
func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

// LogoutHandler godoc
// @Summary Logout and revoke refresh token
// @Description Invalidate the provided refresh token and remove it from Redis whitelist. Always returns HTTP 200 with different message responses:
// @Tags Auth
// @Accept json
// @Produce json
// @Param LogoutRequest body models.LogoutRequest true "Refresh token to revoke"
// @Success 200 {object} models.Response "Logout status message (see Description for possible values)"
// @Router /logout [post]
func (h *AuthHandler) LogoutHandler(c *gin.Context) {
	var req models.LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: constants.MsgLogoutSuccessButTokenInvalidMissingRefreshToken,
			Data:    nil,
		})
		return
	}

	secret := h.cfg.JWT.Secret
	if secret == "" {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: constants.MsgLogoutSuccessButTokenInvalidJWTSecretNotConfigured,
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
			Message: constants.MsgLogoutSuccessButTokenInvalidInvalidRefreshToken,
			Data:    nil,
		})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: constants.MsgLogoutSuccessButTokenInvalidInvalidClaims,
			Data:    nil,
		})
		return
	}

	if t, _ := claims["type"].(string); t != "refresh" {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: constants.MsgLogoutSuccessButTokenInvalidNotRefreshToken,
			Data:    nil,
		})
		return
	}

	oldTokenID, _ := claims["token_id"].(string)

	exists, _, err := database.Get(oldTokenID)
	if err != nil || !exists {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: constants.MsgLogoutSuccessButTokenInvalidTokenIDNotFound,
			Data:    nil,
		})
		return
	}

	if err := database.Delete(oldTokenID); err != nil {
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: constants.MsgLogoutSuccessButTokenInvalidFailedToDelete,
			Data:   nil,
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    http.StatusOK,
		Message: constants.MsgLogoutSuccessTokenDeleted,
		Data:    nil,
	})
}

// OauthHandler godoc
// @Summary OAuth login
// @Description Exchange OAuth code for access/refresh tokens, fetch user info, and store token in Redis whitelist. Returns JWT tokens and user info.
// @Tags Auth
// @Accept json
// @Produce json
// @Param OauthRequest body models.OauthRequest true "OAuth code and redirect URI"
// @Success 200 {object} models.OauthResponse "Access and Refresh token (JWT) and user info"
// @Failure 400 {object} models.Response "Missing code or invalid request"
// @Failure 502 {object} models.Response "Failed to exchange code or get user info"
// @Failure 500 {object} models.Response "Internal server error"
// @Router /oauth [post]
func (h *AuthHandler) OauthHandler(c *gin.Context) {
	var req models.OauthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing code"})
		return
	}
	config := h.cfg
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("code", req.Code)
	form.Set("client_id", config.Oauth.ClientID)
	form.Set("client_secret", config.Oauth.ClientSecret)
	form.Set("redirect_uri", req.RedirectURI)

	tokenResp, err := http.PostForm(config.Oauth.TokenURL, form)
	if err != nil {
		c.JSON(http.StatusBadGateway, models.ErrorResponse(http.StatusBadGateway, "Failed to exchange code: "+err.Error()))
		return
	}
	defer tokenResp.Body.Close()
	body, _ := io.ReadAll(tokenResp.Body)

	var tokenData struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		TokenType   string `json:"token_type"`
	}

	if err := json.Unmarshal(body, &tokenData); err != nil || tokenData.AccessToken == "" {
		c.JSON(http.StatusBadGateway, models.ErrorResponse(http.StatusBadGateway, "Invalid token response when exchanging code"))
		return
	}

	userForm := url.Values{}
	userForm.Set("access_token", tokenData.AccessToken)
	userInfoResp, err := http.PostForm(config.Oauth.UserInfoURL, userForm)
	if err != nil {
		c.JSON(http.StatusBadGateway, models.ErrorResponse(http.StatusBadGateway, "Failed to get user info: "+err.Error()))
		return
	}
	defer userInfoResp.Body.Close()
	userBody, _ := io.ReadAll(userInfoResp.Body)
	var userInfo models.OauthUserInfo
	if err := json.Unmarshal(userBody, &userInfo); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error":           "User info not matching with expected format",
			"raw":             string(userBody),
			"unmarshal_error": err.Error(),
		})
		return
	}

	jwtSecret := config.JWT.Secret
	if jwtSecret == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "jwt secret not configured"))
		return
	}

	tokenID := uuid.NewString()

	accessClaims := jwt.MapClaims{
		"token_id": tokenID,
		"user_id":  userInfo.UserID,
		"type":     "access",
		"exp":      time.Now().Add(time.Duration(config.JWT.Access_Exp) * time.Second).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	signedAccess, err := accessToken.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to sign access token: "+err.Error()))
		return
	}

	refreshClaims := jwt.MapClaims{
		"token_id": tokenID,
		"user_id":  userInfo.UserID,
		"type":     "refresh",
		"exp":      time.Now().Add(time.Duration(config.JWT.Refresh_Exp) * time.Second).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefresh, err := refreshToken.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to sign refresh token: "+err.Error()))
		return
	}

	tokenTTL := time.Duration(config.JWT.Refresh_Exp) * time.Second

	if err := database.Set(tokenID, userInfo.UserID, tokenTTL); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to store token: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.OauthResponse{
		AccessToken:  signedAccess,
		RefreshToken: signedRefresh,
		AuthToken:    tokenData.AccessToken,
		User:         userInfo,
	})
}

// RefreshHandler godoc
// @Summary Refresh access token
// @Description Validate refresh token, rotate token ID, issue new access/refresh tokens, and update Redis whitelist. Returns new JWT tokens.
// @Tags Auth
// @Accept json
// @Produce json
// @Param RefreshRequest body models.RefreshRequest true "Refresh token to validate"
// @Success 200 {object} models.RefreshResponse "New JWT tokens"
// @Failure 400 {object} models.Response "Missing or invalid refresh token"
// @Failure 401 {object} models.Response "Unauthorized or token not found"
// @Failure 500 {object} models.Response "Internal server error"
// @Router /refresh [post]
func (h *AuthHandler) RefreshHandler(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "missing refresh_token"))
		return
	}

	config := h.cfg
	secret := config.JWT.Secret
	if secret == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "jwt secret not configured"))
		return
	}

	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrInvalidOrExpiredRefreshToken))
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "invalid claims"))
		return
	}

	if t, _ := claims["type"].(string); t != "refresh" {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "token is not a refresh token"))
		return
	}

	userID, _ := claims["user_id"].(string)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "invalid refresh token (missing user_id)"))
		return
	}

	oldTokenID, _ := claims["token_id"].(string)

	exists, _, err := database.Get(oldTokenID)
	if err != nil || !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "refresh token not found on whitelist"))
		return
	}

	if err := database.Delete(oldTokenID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to delete old refresh token"))
		return
	}

	newTokenID := uuid.NewString()
	accessClaims := jwt.MapClaims{
		"token_id": newTokenID,
		"user_id":  userID,
		"type":     "access",
		"exp":      time.Now().Add(time.Duration(config.JWT.Access_Exp) * time.Second).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	signedAccess, err := accessToken.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to sign access token"))
		return
	}

	refreshClaims := jwt.MapClaims{
		"token_id": newTokenID,
		"user_id":  userID,
		"type":     "refresh",
		"exp":      time.Now().Add(time.Duration(config.JWT.Refresh_Exp) * time.Second).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefresh, err := refreshToken.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to sign refresh token"))
		return
	}

	tokenTTL := time.Duration(config.JWT.Refresh_Exp) * time.Second

	if err := database.Set(newTokenID, userID, tokenTTL); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to store new refresh token"))
		return
	}

	c.JSON(http.StatusOK, models.RefreshResponse{
		AccessToken:  signedAccess,
		RefreshToken: signedRefresh,
		UserID:       userID,
	})
}
