package handlers

import (
	"dong-service/models"
	"dong-service/services"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserPaymentHandler struct {
	service *services.UserPaymentService
}

func NewUserPaymentHandler(service *services.UserPaymentService) *UserPaymentHandler {
	return &UserPaymentHandler{service: service}
}

// UpdatePaymentInfo godoc
// @Summary Update user payment info
// @Description Update or insert user payment information
// @Tags user-payment
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payment_info body models.UserPaymentInfo true "Payment Info"
// @Success 200 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/user-payments [post]
func (h *UserPaymentHandler) UpdatePaymentInfo(c *gin.Context) {
	var req models.UserPaymentInfo
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "user not authenticated"))
		return
	}

	if err := h.service.HandlePaymentUpdate(c.Request.Context(), userID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to update payment info: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("payment info updated successfully", req))
}

// GetMyPaymentInfos godoc
// @Summary Get user payment infos
// @Description Get all payment information for the authenticated user
// @Tags user-payment
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /api/v1/user-payments/me [get]
func (h *UserPaymentHandler) GetMyPaymentInfos(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, "user not authenticated"))
		return
	}

	infos, err := h.service.GetUserPaymentInfos(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to get payment infos: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("payment infos retrieved successfully", infos))
}

// DeletePaymentInfo godoc
// @Summary Delete user payment info
// @Description Delete a specific payment information record
// @Tags user-payment
// @Security BearerAuth
// @Param id path int true "Payment Info ID"
// @Success 200 {object} models.Response
// @Router /api/v1/user-payments/{id} [delete]
func (h *UserPaymentHandler) DeletePaymentInfo(c *gin.Context) {
	idStr := c.Param("id")
	userID := c.GetString("user_id")

	var id int64
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "invalid ID format"))
		return
	}

	if err := h.service.DeletePaymentInfo(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "failed to delete: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseWithMessage("payment info deleted successfully", nil))
}

