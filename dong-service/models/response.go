package models

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginatedResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Total   int64       `json:"total"`
	Page    int         `json:"page"`
	PerPage int         `json:"per_page"`
}

func SuccessResponse(data interface{}) Response {
	return Response{
		Code:    200,
		Message: "Success",
		Data:    data,
	}
}

func ErrorResponse(code int, message string) Response {
	return Response{
		Code:    code,
		Message: message,
	}
}

func PaginatedSuccessResponse(data interface{}, total int64, page, perPage int) PaginatedResponse {
	return PaginatedResponse{
		Code:    200,
		Message: "Success",
		Data:    data,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}
}
