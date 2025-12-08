package handlers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"dong-service/models"

	"github.com/gin-gonic/gin"
)

type fakeOrderServiceForHandler struct{}

func (f *fakeOrderServiceForHandler) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, error) {
	return nil, nil
}
func (f *fakeOrderServiceForHandler) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error) {
	return []models.Order{}, nil
}
func (f *fakeOrderServiceForHandler) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	return &models.Order{OrderID: id}, nil
}
func (f *fakeOrderServiceForHandler) ConfirmOrder(ctx context.Context, orderID int64, executionPrice *string, source *string, metadata *string) error {
	return nil
}

type fakeOrderServiceErr struct{}

func (f *fakeOrderServiceErr) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, error) {
	return nil, nil
}
func (f *fakeOrderServiceErr) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error) {
	return []models.Order{}, nil
}
func (f *fakeOrderServiceErr) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	return nil, nil
}
func (f *fakeOrderServiceErr) ConfirmOrder(ctx context.Context, orderID int64, executionPrice *string, source *string, metadata *string) error {
	return fmt.Errorf("boom")
}

func TestConfirmOrderHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderServiceForHandler{})

	reqBody := `{"execution_price":"100","source":"test","metadata":"{}"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders/123/confirm", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "123"}}

	handler.ConfirmOrder(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}
}

func TestConfirmOrderHandler_Error(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderServiceErr{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders/123/confirm", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "123"}}

	handler.ConfirmOrder(c)

	if w.Code == http.StatusOK {
		t.Fatalf("expected non-200, got %d", w.Code)
	}
}
