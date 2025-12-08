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
	"strconv"

	"github.com/gin-gonic/gin"
)

type fakeOfferService struct{}

func (f *fakeOfferService) CreateOffer(ctx context.Context, req *models.CreateOfferRequest, walletAddr string) (*models.Offer, error) {
	return &models.Offer{
		OfferID:              12345,
		IntermediaryWalletID: 1,
		Side:                 req.Side,
		Quantity: func() int64 {
			q, _ := strconv.ParseInt(req.Quantity, 10, 64)
			return q
		}(),
		Price: func() int64 {
			if req.Price == nil {
				return 0
			}
			p, _ := strconv.ParseInt(*req.Price, 10, 64)
			return p
		}(),
		Status: "PENDING",
	}, nil
}

func (f *fakeOfferService) ConfirmOffer(ctx context.Context, offerID int64, executionPrice *string, source *string, metadata *string) error {
	return nil
}

func (f *fakeOfferService) ListOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string, pagination map[string]any) ([]models.Offer, error) {
	// create a deterministic set of offers and honor pagination params in tests
	all := []models.Offer{
		{OfferID: 1, Side: models.OfferSideBuy, Symbol: constants.ChainSymbol, Price: 1000},
		{OfferID: 2, Side: models.OfferSideSell, Symbol: constants.ChainSymbol, Price: 2000},
	}

	// if a symbol filter provided, accept either the canonical ChainSymbol or the alias "MZD"
	if symbol != nil && strings.TrimSpace(*symbol) != "" {
		s := strings.TrimSpace(*symbol)
		if strings.EqualFold(s, "MZD") {
			s = constants.ChainSymbol
		}
		if s != constants.ChainSymbol {
			return []models.Offer{}, nil
		}
	}

	// default return all
	if pagination == nil {
		return all, nil
	}

	limit := 0
	offset := 0
	if v, ok := pagination["limit"].(int); ok {
		limit = v
	}
	if v, ok := pagination["offset"].(int); ok {
		offset = v
	}

	if limit <= 0 {
		return all, nil
	}

	start := offset
	if start < 0 {
		start = 0
	}
	if start >= len(all) {
		return []models.Offer{}, nil
	}
	end := start + limit
	if end > len(all) {
		end = len(all)
	}

	return all[start:end], nil
}

func (f *fakeOfferService) GetOfferByID(ctx context.Context, offerID int64) (*models.Offer, error) {
	return &models.Offer{OfferID: offerID, Side: models.OfferSideBuy, Symbol: constants.ChainSymbol, Price: 1000}, nil
}

func (f *fakeOfferService) CountOffers(ctx context.Context, minPrice *string, maxPrice *string, status *string, symbol *string, rate *string) (int64, error) {
	return 2, nil
}

func (f *fakeOfferService) GetIntermediaryWalletAddress(ctx context.Context, walletID int64) (string, error) {
	return "addr-1", nil
}

func TestCreateOfferHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOfferHandler(&fakeOfferService{})

	reqBody := fmt.Sprintf(`{"side":"BUY","symbol":"%s","quantity":"1000"}`, constants.ChainSymbol)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/offers", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req

	// set authenticated wallet address in context
	c.Set("address", "0xdeadbeef")
	handler.CreateOffer(c)

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

func TestCreateOfferHandler_InvalidRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOfferHandler(&fakeOfferService{})

	reqBody := fmt.Sprintf(`{"symbol":"%s"}`, constants.ChainSymbol)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/offers", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req

	// no address in context -> should return unauthorized
	handler.CreateOffer(c)

	if w.Code != http.StatusUnauthorized && w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 bad request, got %d, body=%s", w.Code, w.Body.String())
	}
}

func TestConfirmOfferHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOfferHandler(&fakeOfferService{})

	reqBody := `{"execution_price":"1000","source":"sender","metadata":"{}"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/offers/12345/confirm", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "12345"}}

	handler.ConfirmOffer(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}
}

func TestListOffersHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOfferHandler(&fakeOfferService{})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/offers?min_price=100&max_price=2000", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req

	handler.ListOffers(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}

	// verify pagination metadata (defaults)
	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	meta, ok := resp["meta"].(map[string]any)
	if !ok {
		t.Fatalf("expected meta in response")
	}
	if meta["page"].(float64) != 1 {
		t.Fatalf("expected page 1, got %v", meta["page"])
	}
	if meta["limit"].(float64) != 10 {
		t.Fatalf("expected limit 10, got %v", meta["limit"])
	}
	if meta["total_items"].(float64) != 2 {
		t.Fatalf("expected total_items 2, got %v", meta["total_items"])
	}
	if meta["total_pages"].(float64) != 1 {
		t.Fatalf("expected total_pages 1, got %v", meta["total_pages"])
	}
}

func TestListOffersHandler_Pagination(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOfferHandler(&fakeOfferService{})

	// request page 2 (page=1 zero-based) with limit=1
	req := httptest.NewRequest(http.MethodGet, "/api/v1/offers?page=1&limit=1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req

	handler.ListOffers(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	meta, ok := resp["meta"].(map[string]any)
	if !ok {
		t.Fatalf("expected meta in response")
	}
	// page is 1-based in response
	if meta["page"].(float64) != 2 {
		t.Fatalf("expected page 2, got %v", meta["page"])
	}
	if meta["limit"].(float64) != 1 {
		t.Fatalf("expected limit 1, got %v", meta["limit"])
	}
	if meta["total_items"].(float64) != 2 {
		t.Fatalf("expected total_items 2, got %v", meta["total_items"])
	}
	if meta["total_pages"].(float64) != 2 {
		t.Fatalf("expected total_pages 2, got %v", meta["total_pages"])
	}

	// data should honor limit/offset (1 item returned)
	data, ok := resp["data"].([]any)
	if !ok {
		t.Fatalf("expected data array in response")
	}
	if len(data) != 1 {
		t.Fatalf("expected 1 item on page 2, got %d", len(data))
	}
}

func TestGetOfferDetailHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOfferHandler(&fakeOfferService{})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/offers/123", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "123"}}

	handler.GetOfferDetail(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d, body=%s", w.Code, w.Body.String())
	}
}

func TestListOffersHandler_SymbolAlias(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewOfferHandler(&fakeOfferService{})

	// Request using alias MZD
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/offers?page=0&limit=10&symbol=MZD", nil)
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	c1.Request = req1
	handler.ListOffers(c1)

	if w1.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for symbol=MZD, got %d, body=%s", w1.Code, w1.Body.String())
	}

	var r1 map[string]any
	if err := json.Unmarshal(w1.Body.Bytes(), &r1); err != nil {
		t.Fatalf("failed to unmarshal response1: %v", err)
	}

	// Request using canonical symbol
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/offers?page=0&limit=10&symbol="+constants.ChainSymbol, nil)
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Request = req2
	handler.ListOffers(c2)

	if w2.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for symbol=canonical, got %d, body=%s", w2.Code, w2.Body.String())
	}

	var r2 map[string]any
	if err := json.Unmarshal(w2.Body.Bytes(), &r2); err != nil {
		t.Fatalf("failed to unmarshal response2: %v", err)
	}

	d1, ok1 := r1["data"].([]any)
	d2, ok2 := r2["data"].([]any)
	if !ok1 || !ok2 {
		t.Fatalf("expected data array in both responses")
	}

	if len(d1) != len(d2) {
		t.Fatalf("expected equal data length for MZD and canonical; got %d vs %d", len(d1), len(d2))
	}

	// Compare serialized data for deep equality
	b1, _ := json.Marshal(d1)
	b2, _ := json.Marshal(d2)
	if string(b1) != string(b2) {
		t.Fatalf("expected identical response data for MZD and canonical, got different bodies:\n%s\nvs\n%s", string(b1), string(b2))
	}
}
