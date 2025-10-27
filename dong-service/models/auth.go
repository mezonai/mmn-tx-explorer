package models

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type OauthRequest struct {
	Code        string `json:"code" binding:"required"`
	RedirectURI string `json:"redirect_uri" binding:"required"`
}

type OauthResponse struct {
	AccessToken  string        `json:"access_token"`
	RefreshToken string        `json:"refresh_token"`
	AuthToken    string        `json:"auth_token"`
	User         OauthUserInfo `json:"user"`
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

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	UserID       string `json:"user_id"`
}