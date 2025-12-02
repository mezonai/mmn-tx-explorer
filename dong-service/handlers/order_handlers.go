package handlers

import (
	"database/sql"
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

// ConfirmOrder godoc
// @Summary Confirm order (sender transferred funds to intermediary wallet)
// @Description Mark an order as CONFIRMED and write a CREATED_CONFIRMED history record
// @Tags orders
// @Accept json
// @Produce json
// @Param id path int true "Order ID"
// @Param body body object false "optional payload: {execution_price, source, metadata}"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/orders/{id}/confirm [post]
func (h *OrderHandler) ConfirmOrder(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Missing order id"))
		return
	}

	// simple payload support
	var body struct {
		ExecutionPrice *string `json:"execution_price,omitempty"`
		Source         *string `json:"source,omitempty"`
		Metadata       *string `json:"metadata,omitempty"`
	}
	_ = c.ShouldBindJSON(&body) // optional

	orderID, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid order id"))
		return
	}

	if err := h.orderService.ConfirmOrder(c.Request.Context(), orderID, body.ExecutionPrice, body.Source, body.Metadata); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to confirm order: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Order confirmed", nil))
}

// ListOrders godoc
// @Summary List orders
// @Description List orders with optional filters: min_price, max_price, status, symbol. Supports pagination query params page, limit, order, order_by.
// @Tags orders
// @Accept json
// @Produce json
// @Param min_price query string false "minimum price"
// @Param max_price query string false "maximum price"
// @Param status query string false "order status"
// @Param symbol query string false "symbol"
// @Param page query int false "page"
// @Param limit query int false "limit"
// @Success 200 {object} models.Response{data=[]models.Order}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/orders [get]
func (h *OrderHandler) ListOrders(c *gin.Context) {
	minPrice := c.Query("min_price")
	maxPrice := c.Query("max_price")
	status := c.Query("status")
	symbol := c.Query("symbol")

	// pagination
	pg := utils.GetPaginationParams(c)
	// Build pagination map for repository
	pagination := map[string]any{
		"order_by": pg.OrderBy,
		"order":    pg.Order,
		"limit":    pg.Limit,
		"offset":   pg.Offset,
	}

	var minP *string
	var maxP *string
	var st *string
	var sym *string
	if minPrice != "" {
		minP = &minPrice
	}
	if maxPrice != "" {
		maxP = &maxPrice
	}
	if status != "" {
		st = &status
	}
	if symbol != "" {
		sym = &symbol
	}

	orders, err := h.orderService.ListOrders(c.Request.Context(), minP, maxP, st, sym, pagination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to list orders: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(orders))
}

// GetOrderDetail godoc
// @Summary Get order detail
// @Description Get full order details by id
// @Tags orders
// @Accept json
// @Produce json
// @Param id path int true "Order ID"
// @Success 200 {object} models.Response{data=models.Order}
// @Failure 400 {object} models.Response
// @Failure 404 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/orders/{id} [get]
func (h *OrderHandler) GetOrderDetail(c *gin.Context) {
	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid id"))
		return
	}

	order, err := h.orderService.GetOrderByID(c.Request.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "order not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to fetch order: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(order))
}
