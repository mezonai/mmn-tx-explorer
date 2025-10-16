package handlers

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	config "github.com/thirdweb-dev/indexer/configs"
)

type OauthTokenRequest struct {
	Code        string `json:"code" binding:"required"`
	RedirectURI string `json:"redirect_uri" binding:"required"`
}

type OauthTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

type OauthUserInfo struct {
	Aud         []string `json:"aud"`
	AuthTime    int64    `json:"auth_time"`
	Avatar      string   `json:"avatar"`
	DisplayName string   `json:"display_name"`
	Email       string   `json:"email"`
	Iat         int64    `json:"iat"`
	Iss         string   `json:"iss"`
	MezonID     string   `json:"mezon_id"`
	Rat         int64    `json:"rat"`
	Sub         string   `json:"sub"`
	UserID      string   `json:"user_id"`
	Username    string   `json:"username"`
}

func OauthTokenHandler(c *gin.Context) {
	var req OauthTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing code"})
		return
	}

	// 1. Exchange code for access_token
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("code", req.Code)
	form.Set("client_id", config.Cfg.Oauth.ClientID)
	form.Set("client_secret", config.Cfg.Oauth.ClientSecret)
	form.Set("redirect_uri", req.RedirectURI)

	tokenResp, err := http.PostForm(config.Cfg.Oauth.TokenURL, form)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to exchange code"})
		return
	}
	defer tokenResp.Body.Close()
	body, _ := ioutil.ReadAll(tokenResp.Body)
	var tokenData OauthTokenResponse
	if err := json.Unmarshal(body, &tokenData); err != nil || tokenData.AccessToken == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid token response"})
		return
	}

	
	userForm := url.Values{}
	userForm.Set("access_token", tokenData.AccessToken)
	userInfoResp, err := http.PostForm(config.Cfg.Oauth.UserInfoURL, userForm)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to get user info"})
		return
	}
	defer userInfoResp.Body.Close()
	userBody, _ := ioutil.ReadAll(userInfoResp.Body)
	var userInfo OauthUserInfo
	if err := json.Unmarshal(userBody, &userInfo); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error":           "User info not matching with expected format",
			"raw":             string(userBody),
			"unmarshal_error": err.Error(),
		})
		return
	}

	// 3. Generate internal JWT
	jwtSecret := config.Cfg.JWT.Secret
	claims := jwt.MapClaims{
		"user_id": userInfo.UserID,
		"email":   userInfo.Email,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sign JWT"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"jwt":        signedToken,
		"auth_token": tokenData.AccessToken,
		"user":       userInfo,
	})
}
