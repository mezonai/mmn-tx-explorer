package utils

import (
	"crypto/sha256"
	"dong-service/constants"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/mr-tron/base58/base58"
)

// GetUserIDFromContext extracts and parses the user ID from the gin context
func GetUserIDFromContext(c *gin.Context) (int64, error) {
	user, ok := c.Get("user")
	if !ok {
		return 0, jwt.ErrTokenInvalidClaims
	}

	userIDStr, ok := user.(jwt.MapClaims)["user_id"].(string)
	if !ok {
		return 0, jwt.ErrTokenInvalidClaims
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	fmt.Println("userID", userID, userIDStr)
	if err != nil {
		return 0, err
	}

	return userID, nil
}

// ParseInt64Param parses an int64 parameter from the URL path
func ParseInt64Param(c *gin.Context, paramName string) (int64, error) {
	return strconv.ParseInt(c.Param(paramName), 10, 64)
}

// PaginationParams represents pagination query parameters
type PaginationParams struct {
	Page    int
	Limit   int
	Offset  int
	Order   string
	OrderBy string
}

// GetPaginationParams extracts and validates pagination parameters from query string
func GetPaginationParams(c *gin.Context) PaginationParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	order := c.DefaultQuery("order", "desc")
	orderBy := c.DefaultQuery("order_by", "created_at")

	// Validate and normalize
	if page < 0 {
		page = 0
	}
	if limit < 0 || limit > 100 {
		limit = 10
	}

	offset := page * limit
	return PaginationParams{
		Page:    page,
		Limit:   limit,
		Offset:  offset,
		Order:   order,
		OrderBy: orderBy,
	}
}

// ParseInt16Query parses an optional int16 query parameter
func ParseInt16Query(c *gin.Context, paramName string) *int16 {
	if s := c.Query(paramName); s != "" {
		if v, err := strconv.Atoi(s); err == nil {
			val := int16(v)
			return &val
		}
	}
	return nil
}

// ValidateStatus checks if a status value is valid
func ValidateStatus(status int16) bool {
	return status == constants.CampaignStatusDraft ||
		status == constants.CampaignStatusActive ||
		status == constants.CampaignStatusClosed
}

// GenerateAddress : generates a wallet address from user ID
// TODO: consider using mmn go-sdk later
func GenerateAddress(input string) string {
	sum := sha256.Sum256([]byte(input))
	return base58.Encode(sum[:])
}

// GetAddressFromContext extracts the address from the gin context (set by middleware)
func GetAddressFromContext(c *gin.Context) (string, bool) {
	address, ok := c.Get("address")
	if !ok {
		return "", false
	}

	addressStr, ok := address.(string)
	if !ok {
		return "", false
	}

	return addressStr, true
}

func GetUserIDStringFromContext(c *gin.Context) (string, error) {
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
