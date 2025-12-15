package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"context"
	"dong-service/models"

	"github.com/gin-gonic/gin"
)

// mockOfferService implements services.IOfferService for tests
type mockOfferService struct {
	listOffersFn   func() ([]models.Offer, error)
	countFn        func() (int64, error)
	getByIDFn      func(int64) (*models.Offer, error)
	getByWalletFn  func(string) ([]models.Offer, int64, error)
	createFn       func(*models.CreateOfferRequest, string) (*models.Offer, error)
	updateStatusFn func(*models.UpdateOfferStatusRequest) error
}

func (m *mockOfferService) ListOffers(ctx context.Context, fromAmount *string, toAmount *string, pagination map[string]any) ([]models.Offer, error) { // signature simplified for test
	if m.listOffersFn != nil {
		return m.listOffersFn()
	}
	return nil, nil
}
func (m *mockOfferService) CountOffers(ctx context.Context, walletAddress *string, fromAmount *string, toAmount *string) (int64, error) {
	if m.countFn != nil {
		return m.countFn()
	}
	return 0, nil
}
func (m *mockOfferService) GetOfferByID(ctx context.Context, id int64) (*models.Offer, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(id)
	}
	return nil, sql.ErrNoRows
}
func (m *mockOfferService) GetOffersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Offer, int64, error) {
	if m.getByWalletFn != nil {
		return m.getByWalletFn(walletAddress)
	}
	return nil, 0, nil
}
func (m *mockOfferService) CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string) (*models.Offer, error) {
	if m.createFn != nil {
		return m.createFn(req, walletAddr)
	}
	return nil, nil
}
func (m *mockOfferService) UpdateOfferStatus(ctx context.Context, req *models.UpdateOfferStatusRequest) error {
	if m.updateStatusFn != nil {
		return m.updateStatusFn(req)
	}
	return nil
}

// mockOrderService implements services.IOrderService for tests
type mockOrderService struct {
	createFn      func(int64, *models.CreateOrderRequest, string) (*models.Order, *models.Offer, error)
	listFn        func(int64) ([]models.Order, error)
	getByIDFn     func(int64) (*models.Order, error)
	getByWalletFn func(string) ([]models.Order, int64, error)
	confirmFn     func(int64, string, *string, *string, *string) error
}

func (m *mockOrderService) CreateOrder(ctx context.Context, offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, *models.Offer, error) {
	if m.createFn != nil {
		return m.createFn(offerID, req, walletAddress)
	}
	return nil, nil, nil
}
func (m *mockOrderService) ListOrdersByOffer(ctx context.Context, offerID int64, pagination map[string]any) ([]models.Order, error) {
	if m.listFn != nil {
		return m.listFn(offerID)
	}
	return nil, nil
}
func (m *mockOrderService) GetOrderByID(ctx context.Context, id int64) (*models.Order, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(id)
	}
	return nil, sql.ErrNoRows
}
func (m *mockOrderService) GetOrdersByWalletAddress(ctx context.Context, walletAddress string, pagination map[string]any) ([]models.Order, int64, error) {
	if m.getByWalletFn != nil {
		return m.getByWalletFn(walletAddress)
	}
	return nil, 0, nil
}
func (m *mockOrderService) ConfirmOrder(ctx context.Context, orderID int64, walletAddress string, executionPrice *string, source *string, metadata *string) error {
	if m.confirmFn != nil {
		return m.confirmFn(orderID, walletAddress, executionPrice, source, metadata)
	}
	return nil
}
func (m *mockOrderService) ConfirmOrderAsBuyer(ctx context.Context, orderID int64, o *models.Order) error {
	return nil
}
func (m *mockOrderService) ConfirmOrderAsSeller(ctx context.Context, orderID int64, o *models.Order, offer *models.Offer) error {
	return nil
}

// --- Helper to decode JSON response body as map
func decodeBody(t *testing.T, rr *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &out); err != nil {
		t.Fatalf("failed to decode response body: %v; body=%s", err, rr.Body.String())
	}
	return out
}

func TestListOffers_ReturnsPaginatedResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOfferService{}
	mock.listOffersFn = func() ([]models.Offer, error) {
		return []models.Offer{{OfferID: 1, SellerWalletAddress: "seller1", Symbol: "BTC"}}, nil
	}
	mock.countFn = func() (int64, error) { return 53, nil }

	h := NewOfferHandler(mock)

	rr := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/offers?page=0&limit=10", nil)
	c, _ := gin.CreateTestContext(rr)
	c.Request = req

	h.ListOffers(c)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 got %d", rr.Code)
	}
	data := decodeBody(t, rr)
	if data["message"] != "Offers retrieved" {
		t.Fatalf("unexpected message: %v", data["message"])
	}
	meta := data["meta"].(map[string]any)
	if int(meta["limit"].(float64)) != 10 {
		t.Fatalf("unexpected limit in meta: %v", meta["limit"])
	}
	if int64(meta["total_items"].(float64)) != 53 {
		t.Fatalf("unexpected total_items in meta: %v", meta["total_items"])
	}
}

func TestGetMyOffers_ReturnsUserOffers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOfferService{}
	mock.getByWalletFn = func(wallet string) ([]models.Offer, int64, error) {
		return []models.Offer{{OfferID: 2, SellerWalletAddress: wallet, Symbol: "ETH"}}, 1, nil
	}

	h := NewOfferHandler(mock)
	rr := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/offers/me?page=0&limit=10", nil)
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Set("address", "wallet1")

	h.GetMyOffers(c)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", rr.Code)
	}
	data := decodeBody(t, rr)
	if data["message"] != "Offers retrieved" {
		t.Fatalf("unexpected message: %v", data["message"])
	}
}

func TestCreateOffer_ReturnsCreated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOfferService{}
	created := &models.Offer{OfferID: 10, SellerWalletAddress: "sellerX", Symbol: "BTC"}
	mock.createFn = func(req *models.CreateOfferRequest, walletAddr string) (*models.Offer, error) {
		return created, nil
	}

	h := NewOfferHandler(mock)
	rr := httptest.NewRecorder()
	body := `{"side":"SELL","symbol":"BTC","amount":"10000"}`
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/offers", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Set("address", "sellerX")

	h.CreateOffer(c)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 got %d", rr.Code)
	}
	data := decodeBody(t, rr)
	if data["message"] != "Offer created" {
		t.Fatalf("unexpected message: %v", data["message"])
	}
	payload := data["data"].(map[string]any)
	if payload == nil {
		t.Fatalf("expected data payload but got nil")
	}
}

func TestGetOfferDetail_SuccessAndNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOfferService{}
	found := &models.Offer{OfferID: 5, SellerWalletAddress: "s1", Symbol: "BTC"}
	mock.getByIDFn = func(id int64) (*models.Offer, error) {
		if id == 5 {
			return found, nil
		}
		return nil, sql.ErrNoRows
	}

	h := NewOfferHandler(mock)
	// success
	rr := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/offers/5", nil)
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "5"}}
	h.GetOfferDetail(c)
	if rr.Code != http.StatusOK {
		t.Fatalf("unexpected status: %d; body=%s", rr.Code, rr.Body.String())
	}
	// not found
	rr = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/offers/99", nil)
	c, _ = gin.CreateTestContext(rr)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "99"}}
	h.GetOfferDetail(c)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 got %d; body=%s", rr.Code, rr.Body.String())
	}
}

// Orders tests
func TestCreateOrder_ReturnsCreated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOrderService{}
	mock.createFn = func(offerID int64, req *models.CreateOrderRequest, walletAddress string) (*models.Order, *models.Offer, error) {
		o := &models.Order{OrderID: 100, OfferID: &offerID, Amount: req.Amount, Price: 10}
		return o, &models.Offer{OfferID: offerID}, nil
	}
	h := NewOrderHandler(mock)
	rr := httptest.NewRecorder()
	body := `{"amount": 5}`
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/offers/1/orders", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Set("address", "buyer1")

	h.CreateOrder(c)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 got %d; body=%s", rr.Code, rr.Body.String())
	}
}

func TestListOrdersForOffer_ReturnsOrders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOrderService{}
	mock.listFn = func(offerID int64) ([]models.Order, error) {
		return []models.Order{{OrderID: 1, OfferID: &offerID, Amount: 5}}, nil
	}
	h := NewOrderHandler(mock)
	rr := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/offers/1/orders", nil)
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "1"}}

	h.ListOrdersForOffer(c)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d; body=%s", rr.Code, rr.Body.String())
	}
	data := decodeBody(t, rr)
	if data["message"] != "Success" {
		t.Fatalf("unexpected message: %v", data["message"])
	}
}

func TestGetOrderDetail_SuccessAndNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOrderService{}
	mock.getByIDFn = func(id int64) (*models.Order, error) {
		if id == 1 {
			return &models.Order{OrderID: 1, Amount: 10}, nil
		}
		return nil, sql.ErrNoRows
	}
	h := NewOrderHandler(mock)
	rr := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/orders/1", nil)
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	h.GetOrderDetail(c)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d; body=%s", rr.Code, rr.Body.String())
	}

	rr = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/orders/99", nil)
	c, _ = gin.CreateTestContext(rr)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "99"}}
	h.GetOrderDetail(c)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 got %d; body=%s", rr.Code, rr.Body.String())
	}
}

func TestGetMyOrders_ReturnsPaginated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOrderService{}
	mock.getByWalletFn = func(wallet string) ([]models.Order, int64, error) {
		return []models.Order{{OrderID: 1, BuyerWalletAddress: &wallet}}, 1, nil
	}
	h := NewOrderHandler(mock)
	rr := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/orders/me?page=0&limit=10", nil)
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Set("address", "buyerX")
	h.GetMyOrders(c)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d; body=%s", rr.Code, rr.Body.String())
	}
}

func TestConfirmOrder_ReturnsOk(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockOrderService{}
	mock.confirmFn = func(orderID int64, walletAddress string, executionPrice *string, source *string, metadata *string) error {
		return nil
	}
	h := NewOrderHandler(mock)
	rr := httptest.NewRecorder()
	body := `{"execution_price":"10"}`
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/orders/1/confirm", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	c, _ := gin.CreateTestContext(rr)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Set("address", "sellerX")
	h.ConfirmOrder(c)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d; body=%s", rr.Code, rr.Body.String())
	}
}
