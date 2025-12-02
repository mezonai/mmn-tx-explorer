package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"dong-service/constants"
	"dong-service/models"
	"fmt"

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

func (f *fakeOrderService) ConfirmOrder(ctx context.Context, orderID int64, executionPrice *string, source *string, metadata *string) error {
	// pretend success
	return nil
}

func (f *fakeOrderService) ListOrders(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, pagination map[string]any) ([]models.Order, error) {
	// return a couple of fake orders
	return []models.Order{{OrderID: 1, Side: models.OrderSideBuy, Symbol: constants.ChainSymbol, Price: "1000"}, {OrderID: 2, Side: models.OrderSideSell, Symbol: constants.ChainSymbol, Price: "2000"}}, nil
}

func (f *fakeOrderService) GetOrderByID(ctx context.Context, orderID int64) (*models.Order, error) {
	return &models.Order{OrderID: orderID, Side: models.OrderSideBuy, Symbol: constants.ChainSymbol, Price: "1000"}, nil
}

func TestCreateOrderHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderService{})

	reqBody := fmt.Sprintf(`{"side":"BUY","symbol":"%s","quantity":"1000"}`, constants.ChainSymbol)
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
	reqBody := fmt.Sprintf(`{"symbol":"%s"}`, constants.ChainSymbol)
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

func TestConfirmOrderHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderService{})

	reqBody := `{"execution_price":"1000","source":"sender","metadata":"{}"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders/12345/confirm", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	// set path param
	c.Params = gin.Params{{Key: "id", Value: "12345"}}

	handler.ConfirmOrder(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}
}

func TestListOrdersHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderService{})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders?min_price=100&max_price=2000", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req

	handler.ListOrders(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}
}

func TestGetOrderDetailHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOrderHandler(&fakeOrderService{})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders/123", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "123"}}

	handler.GetOrderDetail(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}
}
