package models

import "net/http"

// Response represents a standard API response
type Response struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// PaginationMeta contains pagination metadata
type PaginationMeta struct {
	Page      int   `json:"page"`
	Limit     int   `json:"limit"`
	Total     int64 `json:"total"`
	TotalPage int64 `json:"total_page"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success    bool           `json:"success"`
	Message    string         `json:"message"`
	Data       any            `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

// SuccessResponse creates a successful response with data
func SuccessResponse(data any) Response {
	return Response{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    data,
	}
}

// SuccessResponseWithMessage creates a successful response with custom message
func SuccessResponseWithMessage(message string, data any) Response {
	return Response{
		Code:    http.StatusOK,
		Message: message,
		Data:    data,
	}
}

// ErrorResponse creates an error response
func ErrorResponse(code int, message string) Response {
	return Response{
		Code:    code,
		Message: message,
	}
}

// PaginatedSuccessResponse creates a paginated success response
func PaginatedSuccessResponse(message string, data any, page, limit int, total int64) PaginatedResponse {
	totalPage := max((total+int64(limit)-1)/int64(limit), 0)

	return PaginatedResponse{
		Success: true,
		Message: message,
		Data:    data,
		Pagination: PaginationMeta{
			Page:      page,
			Limit:     limit,
			Total:     total,
			TotalPage: totalPage,
		},
	}
}

// HealthResponse represents a health check response
type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Time    string `json:"time"`
}
