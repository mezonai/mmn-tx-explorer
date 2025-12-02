package handlers

import (
	"dong-service/logger"
	"dong-service/models"
	"dong-service/services"
	"dong-service/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService services.IOrderService
}

func NewOrderHandler(orderService services.IOrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

// CreateOrder godoc
// @Summary Create a new order
// @Description Create a new trading order and record initial order history
// @Tags orders
// @Accept json
// @Produce json
// @Param order body models.CreateOrderRequest true "Create Order"
// @Success 201 {object} models.Response{data=models.Order}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/orders [post]
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	// try to get optional user id
	if userID, err := utils.GetUserIDFromContext(c); err == nil {
		// put the user id into the request later if available
		_ = userID
	}

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("invalid create order request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid request: "+err.Error()))
		return
	}

	// If user is authenticated, set the user id from context
	if uid, err := utils.GetUserIDFromContext(c); err == nil {
		req.UserID = &uid
	}

	order, err := h.orderService.CreateOrder(c.Request.Context(), &req)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create order")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to create order: "+err.Error()))
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage("Order created", order))
}
