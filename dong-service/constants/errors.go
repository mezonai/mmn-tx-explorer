package constants

// Error messages for the application
// Centralized error messages for consistency and easy maintenance

// Authentication & Authorization Errors
const (
	ErrUnauthorized           = "Unauthorized"
	ErrInvalidUserID          = "Invalid user ID"
	ErrInvalidToken           = "Invalid token"
	ErrTokenExpired           = "Token expired"
	ErrInvalidOrExpiredRefreshToken = "Invalid or expired refresh token!"
	ErrPermissionDenied       = "You don't have permission to perform this action"
	ErrCampaignNotFoundOrNoPermission = "Donation campaign not found or you don't have permission"
)

// Validation Errors
const (
	ErrInvalidRequestBody     = "Invalid request body"
	ErrInvalidCampaignID      = "Invalid campaign ID"
	ErrInvalidStatus          = "Invalid status"
	ErrNoFieldsToUpdate       = "No fields to update"
	ErrInvalidDateFormat      = "Invalid date format"
	ErrEndDateInPast          = "End date must be in the future"
	ErrInvalidGoalAmount      = "Goal amount must be greater than 0"
	ErrInvalidURL             = "Invalid URL format"
)

// Database Errors
const (
	ErrFailedToCreateCampaign = "Failed to create campaign"
	ErrFailedToGetCampaign    = "Failed to get campaign"
	ErrFailedToGetCampaigns   = "Failed to get campaigns"
	ErrFailedToUpdateCampaign = "Failed to update campaign"
	ErrFailedToActivateCampaign = "Failed to activate campaign"
	ErrFailedToCloseCampaign  = "Failed to close campaign"
	ErrCampaignNotFound       = "Donation campaign not found"
	ErrDatabaseConnection     = "Database connection error"
	ErrDatabaseQuery          = "Database query error"
)

// Business Logic Errors
const (
	ErrCampaignAlreadyActive  = "Campaign is already active"
	ErrCampaignAlreadyClosed  = "Campaign is already closed"
	ErrCannotActivateClosed   = "Cannot activate a closed campaign"
	ErrCannotUpdateClosed     = "Cannot update a closed campaign"
	ErrCampaignExpired        = "Campaign has expired"
)

// Success Messages
const (
	MsgCampaignCreated        = "Campaign created successfully"
	MsgCampaignUpdated        = "Campaign updated successfully"
	MsgCampaignActivated      = "Campaign activated successfully"
	MsgCampaignClosed         = "Campaign closed successfully"
	MsgCampaignRetrieved      = "Campaign retrieved successfully"
	MsgCampaignsRetrieved     = "Campaigns retrieved successfully"
)

// Logout Messages
const (
	MsgLogoutSuccessButTokenInvalidMissingRefreshToken = "Logout successful but token invalid: missing refresh_token"
	MsgLogoutSuccessButTokenInvalidJWTSecretNotConfigured = "Logout successful but token invalid: jwt secret not configured"
	MsgLogoutSuccessButTokenInvalidInvalidRefreshToken = "Logout successful but token invalid: invalid refresh token"
	MsgLogoutSuccessButTokenInvalidInvalidClaims = "Logout successful but token invalid: invalid claims"
	MsgLogoutSuccessButTokenInvalidNotRefreshToken = "Logout successful but token invalid: token is not a refresh token"
	MsgLogoutSuccessButTokenInvalidTokenIDNotFound = "Logout successful but token invalid: token ID not found in whitelist"
	MsgLogoutSuccessButTokenInvalidFailedToDelete = "Logout successful but token invalid: failed to delete refresh token"
	MsgLogoutSuccessTokenDeleted = "Logout successful, token deleted from whitelist"
)
