package services

import (
	"context"
	"regexp"
	"testing"
	"time"

	"dong-service/database"
	"dong-service/models"
	"dong-service/repository"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestCreateOrder_WithExplicitAmount(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	// GetOfferByID expectation
	mock.ExpectQuery(regexp.QuoteMeta("SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, min_amount, max_amount, price, price_rate, price_type, status, metadata, created_at, updated_at FROM public.offers WHERE offer_id = $1")).
		WithArgs(int64(1)).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "intermediary_wallet_id", "wallet_address", "side", "symbol", "quantity", "total_quantity", "min_amount", "max_amount", "price", "price_rate", "price_type", "status", "metadata", "created_at", "updated_at"}).AddRow(1, 0, "addr", "SELL", "MMN", 100, 100, 1, 100, 1000, nil, "FIXED", "PENDING", nil, time.Now(), time.Now()))

	// Check active orders - none
	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(1) FROM public.orders WHERE offer_id = $1 AND status IN ('PENDING','CONFIRMED')")).WithArgs(int64(1)).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	// Begin transaction
	mock.ExpectBegin()

	// Since we pass an intermediary wallet id, no GetOrCreateAvailableWallet needed

	// Reserve quantity on offer first
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))

	// Expect order insert with amount (1000)
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO public.orders")).
		WillReturnRows(sqlmock.NewRows([]string{"order_id", "created_at", "updated_at"}).AddRow(int64(7), now, now))

	mock.ExpectCommit()

	req := &models.CreateOrderRequest{
		Quantity: "100",
		Price:    func() *string { s := "10"; return &s }(),
		Amount:   func() *string { s := "1000"; return &s }(),
	}

	o, err := svc.CreateOrder(context.Background(), 1, req, "wallet-addr")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if o.OrderID != 7 {
		t.Fatalf("expected order id 7, got %d", o.OrderID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCreateOrder_AmountComputedFromQuantityAndPrice(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	mock.ExpectQuery(regexp.QuoteMeta("SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, min_amount, max_amount, price, price_rate, price_type, status, metadata, created_at, updated_at FROM public.offers WHERE offer_id = $1")).
		WithArgs(int64(2)).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "intermediary_wallet_id", "wallet_address", "side", "symbol", "quantity", "total_quantity", "min_amount", "max_amount", "price", "price_rate", "price_type", "status", "metadata", "created_at", "updated_at"}).AddRow(2, 0, "addr", "BUY", "MMN", 1000, 1000, 1, 1000, 200, nil, "FIXED", "PENDING", nil, time.Now(), time.Now()))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(1) FROM public.orders WHERE offer_id = $1 AND status IN ('PENDING','CONFIRMED')")).WithArgs(int64(2)).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	mock.ExpectBegin()

	// expected computed amount = quantity(5) * price(200) = 1000
	now := time.Now()
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO public.orders")).
		WillReturnRows(sqlmock.NewRows([]string{"order_id", "created_at", "updated_at"}).AddRow(int64(8), now, now))
	mock.ExpectCommit()

	req := &models.CreateOrderRequest{
		Quantity: "5",
		Price:    func() *string { s := "200"; return &s }(),
	}

	o, err := svc.CreateOrder(context.Background(), 2, req, "wallet-addr")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if o.Amount != 1000 {
		t.Fatalf("expected amount 1000, got %d", o.Amount)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCreateOrder_NoSymbolProvided(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	// Offer lookup — returns symbol MMN
	mock.ExpectQuery(regexp.QuoteMeta("SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, min_amount, max_amount, price, price_rate, price_type, status, metadata, created_at, updated_at FROM public.offers WHERE offer_id = $1")).
		WithArgs(int64(20)).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "intermediary_wallet_id", "wallet_address", "side", "symbol", "quantity", "total_quantity", "min_amount", "max_amount", "price", "price_rate", "price_type", "status", "metadata", "created_at", "updated_at"}).AddRow(20, 0, "addr", "SELL", "MMN", 100, 100, 1, 100, 1000, nil, "FIXED", "PENDING", nil, time.Now(), time.Now()))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(1) FROM public.orders WHERE offer_id = $1 AND status IN ('PENDING','CONFIRMED')")).WithArgs(int64(20)).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	mock.ExpectBegin()

	// Reserve quantity
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))

	// Insert order
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO public.orders")).WillReturnRows(sqlmock.NewRows([]string{"order_id", "created_at", "updated_at"}).AddRow(int64(400), now, now))

	mock.ExpectCommit()

	// Build request (orders no longer accept symbol/side in the request)
	req := &models.CreateOrderRequest{
		Quantity: "5",
		Price:    func() *string { s := "200"; return &s }(),
	}

	o, err := svc.CreateOrder(context.Background(), 20, req, "wallet-addr")
	if err != nil {
		t.Fatalf("create order expected success, got %v", err)
	}
	if o == nil {
		t.Fatalf("expected created order, got nil")
	}

	// Ensure order was created and linked to the offer
	if o.OfferID == nil || *o.OfferID != 20 {
		t.Fatalf("expected order to reference offer 20, got %v", o.OfferID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCreateOrder_FailsWhenOfferHasActiveOrder(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	// Offer lookup
	mock.ExpectQuery(regexp.QuoteMeta("SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, min_amount, max_amount, price, price_rate, price_type, status, metadata, created_at, updated_at FROM public.offers WHERE offer_id = $1")).
		WithArgs(int64(99)).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "intermediary_wallet_id", "wallet_address", "side", "symbol", "quantity", "total_quantity", "min_amount", "max_amount", "price", "price_rate", "price_type", "status", "metadata", "created_at", "updated_at"}).AddRow(99, 0, "addr", "SELL", "MMN", 100, 100, 1, 100, 1000, nil, "FIXED", "PENDING", nil, time.Now(), time.Now()))

	// Active orders check — find an active order
	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(1) FROM public.orders WHERE offer_id = $1 AND status IN ('PENDING','CONFIRMED')")).WithArgs(int64(99)).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	// Build request
	req := &models.CreateOrderRequest{Quantity: "5", Price: func() *string { s := "200"; return &s }()}

	o, err := svc.CreateOrder(context.Background(), 99, req, "wallet-addr")
	if err == nil {
		t.Fatalf("expected error when offer has active order, got order: %v", o)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestGetOrderByID_IncludesOfferMetadata(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	// Setup GetOrderByID expectation
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("SELECT order_id, offer_id, wallet_address, quantity, amount, price, status, external_ref, metadata, expires_at, created_at, updated_at FROM public.orders WHERE order_id = $1")).
		WithArgs(int64(42)).WillReturnRows(sqlmock.NewRows([]string{"order_id", "offer_id", "wallet_address", "quantity", "amount", "price", "status", "external_ref", "metadata", "expires_at", "created_at", "updated_at"}).AddRow(int64(42), int64(7), nil, int64(3), int64(600), int64(200), "PENDING", nil, nil, nil, now, now))

	// Expect the service to fetch the offer and attach metadata
	mock.ExpectQuery(regexp.QuoteMeta("SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, min_amount, max_amount, price, price_rate, price_type, status, metadata, created_at, updated_at FROM public.offers WHERE offer_id = $1")).
		WithArgs(int64(7)).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "intermediary_wallet_id", "wallet_address", "side", "symbol", "quantity", "total_quantity", "min_amount", "max_amount", "price", "price_rate", "price_type", "status", "metadata", "created_at", "updated_at"}).AddRow(int64(7), 0, "addr", "SELL", "MMN", 100, 100, 1, 100, 1000, nil, "FIXED", "PENDING", "{\"k\":\"v\"}", now, now))

	o, err := svc.GetOrderByID(context.Background(), 42)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}

	if o == nil {
		t.Fatalf("expected order, got nil")
	}

	if o.OfferMetadata == nil || *o.OfferMetadata != "{\"k\":\"v\"}" {
		t.Fatalf("expected offer metadata to match, got %v", o.OfferMetadata)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestConfirmOrder_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	// GetOrderByID expectation - pending order created recently
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("SELECT order_id, offer_id, wallet_address, quantity, amount, price, status, external_ref, metadata, expires_at, created_at, updated_at FROM public.orders WHERE order_id = $1")).
		WithArgs(int64(5)).WillReturnRows(sqlmock.NewRows([]string{"order_id", "offer_id", "wallet_address", "quantity", "amount", "price", "status", "external_ref", "metadata", "expires_at", "created_at", "updated_at"}).AddRow(int64(5), int64(1), nil, int64(10), int64(1000), int64(100), "PENDING", nil, nil, nil, now, now))

	mock.ExpectBegin()

	// Update order status to CONFIRMED
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.orders")).WillReturnResult(sqlmock.NewResult(0, 1))

	// Apply confirmed quantity (decrement total_quantity / potentially complete offer)
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectCommit()

	err = svc.ConfirmOrder(context.Background(), 5, func() *string { s := "100"; return &s }(), func() *string { s := "src"; return &s }(), func() *string { s := "{}"; return &s }())
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestConfirmOrder_ExpiredCancels(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	// GetOrderByID expectation - pending order created long ago (expired)
	old := time.Now().Add(-16 * time.Minute)
	mock.ExpectQuery(regexp.QuoteMeta("SELECT order_id, offer_id, wallet_address, quantity, amount, price, status, external_ref, metadata, expires_at, created_at, updated_at FROM public.orders WHERE order_id = $1")).
		WithArgs(int64(6)).WillReturnRows(sqlmock.NewRows([]string{"order_id", "offer_id", "wallet_address", "quantity", "amount", "price", "status", "external_ref", "metadata", "expires_at", "created_at", "updated_at"}).AddRow(int64(6), int64(1), nil, int64(10), int64(1000), int64(100), "PENDING", nil, nil, nil, old, old))

	mock.ExpectBegin()

	// Update order status to CANCELED
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.orders")).WillReturnResult(sqlmock.NewResult(0, 1))

	// Release reserved quantity back to offer
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectCommit()

	err = svc.ConfirmOrder(context.Background(), 6, nil, nil, nil)
	if err == nil {
		t.Fatalf("expected error due to expiry, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCreateThenConfirm_Integration(t *testing.T) {
	// This test simulates end-to-end flow: create order (reserving offer quantity)
	// then confirm the same order (finalizing consumption)
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	offerRepo := repository.NewOfferRepository(db, "public")
	svc := NewOrderService(orderRepo, offerRepo)

	// Offer lookup
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("SELECT offer_id, intermediary_wallet_id, wallet_address, side, symbol, quantity, total_quantity, min_amount, max_amount, price, price_rate, price_type, status, metadata, created_at, updated_at FROM public.offers WHERE offer_id = $1")).
		WithArgs(int64(10)).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "intermediary_wallet_id", "wallet_address", "side", "symbol", "quantity", "total_quantity", "min_amount", "max_amount", "price", "price_rate", "price_type", "status", "metadata", "created_at", "updated_at"}).AddRow(10, 0, "addr", "SELL", "MMN", 100, 100, 1, 100, 1000, nil, "FIXED", "PENDING", nil, now, now))

	// Check active orders - none
	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(1) FROM public.orders WHERE offer_id = $1 AND status IN ('PENDING','CONFIRMED')")).WithArgs(int64(10)).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	// Begin create tx
	mock.ExpectBegin()
	// Reserve quantity
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))
	// Insert order
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO public.orders")).WillReturnRows(sqlmock.NewRows([]string{"order_id", "created_at", "updated_at"}).AddRow(int64(300), now, now))
	// Update intermediary wallet
	mock.ExpectCommit()

	// perform create
	req := &models.CreateOrderRequest{
		Quantity: "5",
		Price:    func() *string { s := "200"; return &s }(),
	}

	o, err := svc.CreateOrder(context.Background(), 10, req, "wallet-addr")
	if err != nil {
		t.Fatalf("create order expected success, got %v", err)
	}

	if o.OrderID != 300 {
		t.Fatalf("expected order id 300, got %d", o.OrderID)
	}

	// Confirm the order - expects pending order read and confirm flow
	mock.ExpectQuery(regexp.QuoteMeta("SELECT order_id, offer_id, wallet_address, quantity, amount, price, status, external_ref, metadata, expires_at, created_at, updated_at FROM public.orders WHERE order_id = $1")).
		WithArgs(int64(300)).WillReturnRows(sqlmock.NewRows([]string{"order_id", "offer_id", "wallet_address", "quantity", "amount", "price", "status", "external_ref", "metadata", "expires_at", "created_at", "updated_at"}).AddRow(int64(300), int64(10), nil, int64(5), int64(1000), int64(200), "PENDING", nil, nil, nil, now, now))

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.orders")).WillReturnResult(sqlmock.NewResult(0, 1))
	// order_history writes removed — tests don't expect history inserts anymore
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	if err := svc.ConfirmOrder(context.Background(), 300, func() *string { s := "200"; return &s }(), func() *string { s := "src"; return &s }(), func() *string { s := "{}"; return &s }()); err != nil {
		t.Fatalf("confirm order expected success, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
