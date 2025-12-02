package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"dong-service/models"

	"github.com/gin-gonic/gin"
)

type fakeOrderService struct{}

func (f *fakeOrderService) CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error) {
	return &models.Order{
		OrderID:              12345,
		IntermediaryWalletID: 1,
		Side:                 req.Side,
		Symbol:               req.Symbol,
		Quantity:             req.Quantity,
		Price:                "0",
		Status:               "PENDING",
	}, nil
}

func TestCreateOrderHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderService{})

	reqBody := `{"side":"BUY","symbol":"MMN_USD","quantity":"1000"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req

	handler.CreateOrder(c)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201 created, got %d, body=%s", w.Code, w.Body.String())
	}

	var resp models.Response
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Data == nil {
		t.Fatalf("expected response data, got nil")
	}
}

func TestCreateOrderHandler_InvalidRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderService{})

	// invalid because missing required fields
	reqBody := `{"symbol":"MMN_USD"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req

	handler.CreateOrder(c)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 bad request, got %d, body=%s", w.Code, w.Body.String())
	}
}
