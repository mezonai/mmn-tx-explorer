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
// @Summary Create an order against an offer
// @Description Create an order under an offer (offers can have multiple orders)
// @Tags orders
// @Accept json
// @Produce json
// @Param id path int true "Offer ID"
// @Param order body models.CreateOrderRequest true "Create Order"
// @Success 201 {object} models.Response{data=models.Order}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Security BearerAuth
// @Router /api/v1/offers/{id}/orders [post]
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	walletAddr, _ := utils.GetAddressFromContext(c)

	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid offer id"))
		return
	}

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error().Err(err).Msg("invalid create order request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid request: "+err.Error()))
		return
	}

	order, err := h.orderService.CreateOrder(c.Request.Context(), id, &req, walletAddr)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create order")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Failed to create order: "+err.Error()))
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponseWithMessage("Order created", order))
}

// ListOrdersForOffer godoc
// @Summary List orders for an offer
// @Description List all orders created against an offer
// @Tags orders
// @Accept json
// @Produce json
// @Param id path int true "Offer ID"
// @Param page query int false "page"
// @Param limit query int false "limit"
// @Success 200 {object} models.Response{data=[]models.Order}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/offers/{id}/orders [get]
func (h *OrderHandler) ListOrdersForOffer(c *gin.Context) {
	id, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid offer id"))
		return
	}

	pg := utils.GetPaginationParams(c)
	pagination := map[string]any{"order_by": pg.OrderBy, "order": pg.Order, "limit": pg.Limit, "offset": pg.Offset}

	orders, err := h.orderService.ListOrdersByOffer(c.Request.Context(), id, pagination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to list orders: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(orders))
}

// GetOrderDetail godoc
// @Summary Get order detail
// @Description Fetch order details by id
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
	orderID, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid order id"))
		return
	}

	o, err := h.orderService.GetOrderByID(c.Request.Context(), orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse(http.StatusNotFound, "order not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to fetch order: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(o))
}

// ListOrdersByWallet godoc
// @Summary List orders for a wallet address
// @Description List all orders created by a wallet address (most recent first)
// @Tags orders
// @Accept json
// @Produce json
// @Param wallet_address query string false "wallet address" (if omitted, will use authenticated caller's address if present)
// @Success 200 {object} models.Response{data=[]models.Order}
// @Failure 400 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/orders [get]
func (h *OrderHandler) ListOrdersByWallet(c *gin.Context) {
	walletAddress := c.Query("wallet_address")
	if walletAddress == "" {
		// try to use authenticated address if present
		if addr, ok := utils.GetAddressFromContext(c); ok {
			walletAddress = addr
		}
	}

	if walletAddress == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "missing wallet_address query parameter or authenticated address"))
		return
	}

	orders, err := h.orderService.GetOrdersByWalletAddress(c.Request.Context(), walletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to list orders: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(orders))
}

// ConfirmOrder godoc
// @Summary Confirm order (mark PENDING -> CONFIRMED when funds received)
// @Description Confirm an order and write CREATED_CONFIRMED or CANCELED history accordingly
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

	walletAddress, _ := utils.GetAddressFromContext(c)

	var body struct {
		ExecutionPrice *string `json:"execution_price,omitempty"`
		Source         *string `json:"source,omitempty"`
		BankInfo       *string `json:"bank_info,omitempty"`
	}
	_ = c.ShouldBindJSON(&body)

	orderID, err := utils.ParseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid order id"))
		return
	}

	if err := h.orderService.ConfirmOrder(c.Request.Context(), orderID, walletAddress, body.ExecutionPrice, body.Source, body.BankInfo); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to confirm order: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("Order confirmed", nil))
}
