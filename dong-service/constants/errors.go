package constants

import "errors"

// Error messages for the application
// Centralized error messages for consistency and easy maintenance

// Authentication & Authorization Errors
const (
	ErrUnauthorized                   = "Unauthorized"
	ErrInvalidUserID                  = "Invalid user ID"
	ErrInvalidToken                   = "Invalid token"
	ErrTokenExpired                   = "Token expired"
	ErrInvalidOrExpiredRefreshToken   = "Invalid or expired refresh token!"
	ErrPermissionDenied               = "You don't have permission to perform this action"
	ErrCampaignNotFoundOrNoPermission = "Donation campaign not found or you don't have permission"
	ErrOfferNotFoundNoPermission	  = "Offer not found or you don't have permission"
)

// Validation Errors
const (
	ErrInvalidRequestBody   = "Invalid request body"
	ErrInvalidCampaignID    = "Invalid campaign ID"
	ErrInvalidStatus        = "Invalid status"
	ErrNoFieldsToUpdate     = "No fields to update"
	ErrInvalidDateFormat    = "Invalid date format : must be YYYY-MM-DD"
	ErrEndDateInPast        = "End date must be in the future"
	ErrInvalidGoalAmount    = "Goal must be greater than 0 and less than or equal to 100 billion"
	ErrInvalidURL           = "Invalid URL format"
	ErrInternalServer       = "Internal server error"
	ErrMissingRedEnvelopeID = "Red Envelope ID must not null"
)

// Database Errors
const (
	ErrFailedToCreateCampaign          = "Failed to create campaign"
	ErrFailedToCreateAndActiveCampaign = "Failed to create and activate campaign"
	ErrFailedToGetCampaign             = "Failed to get campaign"
	ErrFailedToGetCampaigns            = "Failed to get campaigns"
	ErrFailedToUpdateCampaign          = "Failed to update campaign"
	ErrFailedToActivateCampaign        = "Failed to activate campaign"
	ErrFailedToCloseCampaign           = "Failed to close campaign"
	ErrFailedToDeleteDraftCampaign     = "Failed to delete campaign"
	ErrCampaignNotFound                = "Donation campaign not found"
	ErrDatabaseConnection              = "Database connection error"
	ErrDatabaseQuery                   = "Database query error"
	ErrFailedToCheckRedEnvelope        = "Failed to check red envelope"
	ErrFailedToCreatedRedEnvelope      = "Failed to create red envelope"
	ErrFailedToGetRedEnvelope          = "Failed to get red envelope"
	ErrFailedToGetRedEnvelopeStats     = "Failed to get red envelope stats"
	ErrFailedToGetRedEnvelopes         = "Failed to get red envelopes"
	ErrFailedToCountRedEnvelopes       = "Failed to get count of red envelopes"
	ErrFailedToUpdateRedEnvelopeStatus = "Failed to update red envelope status"
	ErrFailedToGetRedEnvelopeInfo      = "Failed to retrieve red envelope info"
	ErrFailedToCloseRedEnvelope        = "Failed to close red envelope"
	ErrFailedToClaimAmount             = "Failed to claim amount"
	ErrFailedToClaim                   = "Failed to claim red envelope"
	ErrOfferNotFound                   = "Offer not found"
	ErrFailedToGetOffer				   = "Failed to get offer"
	ErrFailedToCancelOffer             = "Failed to cancel offer"
	ErrFailedToCancelOfferWithOrder    = "Failed to cancel offer with active orders"
	ErrFailedToRefundOfferAmount       = "Failed to refund offer amount"

)

// Business Logic Errors
const (
	ErrCampaignAlreadyActive       = "Campaign is already active"
	ErrCampaignAlreadyClosed       = "Campaign is already closed"
	ErrCannotActivateClosed        = "Cannot activate a closed campaign"
	ErrCannotUpdateClosed          = "Cannot update a closed campaign"
	ErrCampaignExpired             = "Campaign has expired"
	ErrUserIDNotMatchRedEnvelopeID = "User id does not match owner of red envelope"
)

// Success Messages
const (
	MsgCampaignCreated             = "Campaign created successfully"
	MsgCampaignCreatedAndActivated = "Campaign created and activated successfully"
	MsgCampaignUpdated             = "Campaign updated successfully"
	MsgCampaignActivated           = "Campaign activated successfully"
	MsgCampaignClosed              = "Campaign closed successfully"
	MsgDraftCampaignDeleted        = "Campaign deleted successfully"
	MsgCampaignRetrieved           = "Campaign retrieved successfully"
	MsgCampaignsRetrieved          = "Campaigns retrieved successfully"
	MsgRedEnvelopeStatsRetrieved   = "Red envelope statistics retrieved successfully"
	MsgRedEnvelopeCreated          = "Red envelope created successfully"
	MsgRedEnvelopeUpdated          = "Red envelope status updated successfully"
	MsgRedEnvelopeRetrieved        = "Red envelope retrieved successfully"
	MsgRedEnvelopeClosed           = "Red envelope closed successfully"
	MsgRedEnvelopeAmountClaimed    = "Red envelope amount claimed successfully"
	MsgRedEnvelopeClaimed          = "Red envelope claimed successfully"
	MsgOfferCancelled              = "Offer cancelled successfully"
)

// Logout Messages
const (
	MsgLogoutSuccessButTokenInvalidMissingRefreshToken    = "Logout successful but token invalid: missing refresh_token"
	MsgLogoutSuccessButTokenInvalidJWTSecretNotConfigured = "Logout successful but token invalid: jwt secret not configured"
	MsgLogoutSuccessButTokenInvalidInvalidRefreshToken    = "Logout successful but token invalid: invalid refresh token"
	MsgLogoutSuccessButTokenInvalidInvalidClaims          = "Logout successful but token invalid: invalid claims"
	MsgLogoutSuccessButTokenInvalidNotRefreshToken        = "Logout successful but token invalid: token is not a refresh token"
	MsgLogoutSuccessButTokenInvalidTokenIDNotFound        = "Logout successful but token invalid: token ID not found in whitelist"
	MsgLogoutSuccessButTokenInvalidFailedToDelete         = "Logout successful but token invalid: failed to delete refresh token"
	MsgLogoutSuccessTokenDeleted                          = "Logout successful, token deleted from whitelist"
)

var (
	ErrAlreadyClaimed             = errors.New("you have already claimed this lucky money")
	ErrLimitReached               = errors.New("red envelope claims limit reached")
	ErrQueueNotInit               = errors.New("queue not initialized or expired")
	ErrInsufficientAccountBalance = errors.New("insufficient account balance")
	ErrOfferHasActiveOrders       = errors.New("offer already has active pending orders")
	ErrTxHashAlreadyUsed          = errors.New("transaction hash already used")
)
