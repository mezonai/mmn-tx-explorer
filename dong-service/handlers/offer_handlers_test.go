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
	return []models.Offer{{OfferID: 1, Side: models.OfferSideBuy, Symbol: constants.ChainSymbol, Price: 1000}, {OfferID: 2, Side: models.OfferSideSell, Symbol: constants.ChainSymbol, Price: 2000}}, nil
}

func (f *fakeOfferService) GetOfferByID(ctx context.Context, offerID int64) (*models.Offer, error) {
	return &models.Offer{OfferID: offerID, Side: models.OfferSideBuy, Symbol: constants.ChainSymbol, Price: 1000}, nil
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
