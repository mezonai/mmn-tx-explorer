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

func TestCreateOffer_WithExplicitWalletID(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	offerRepo := repository.NewOfferRepository(db, "public")
	walletRepo := repository.NewIntermediaryWalletRepository(db, "public")
	svc := NewOfferService(offerRepo, walletRepo)

	// Begin transaction
	mock.ExpectBegin()

	// Offer insert
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO public.offers (")).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "created_at", "updated_at"}).AddRow(int64(7), now, now))

	mock.ExpectCommit()

	req := &models.CreateOfferRequest{
		IntermediaryWalletID: func() *int64 { i := int64(2); return &i }(),
		Side:                 models.OfferSideSell,
		Symbol:               "MMN",
		Quantity:             "100",
		Price:                func() *string { s := "10"; return &s }(),
	}

	o, err := svc.CreateOffer(context.Background(), req, "wallet-addr")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if o == nil {
		t.Fatalf("expected created offer, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCreateOffer_AutoAllocatesWallet(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	offerRepo := repository.NewOfferRepository(db, "public")
	walletRepo := repository.NewIntermediaryWalletRepository(db, "public")
	svc := NewOfferService(offerRepo, walletRepo)

	// Begin transaction
	mock.ExpectBegin()

	// Get available wallet FOR UPDATE
	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, wallet_address, encrypted_private_key, status, type, created_at, updated_at FROM public.intermediary_wallet WHERE status = $1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED")).WillReturnRows(sqlmock.NewRows([]string{"id", "wallet_address", "encrypted_private_key", "status", "type", "created_at", "updated_at"}).AddRow(int64(3), "addr3", "enc", "READY", "OFFER", time.Now(), time.Now()))

	// UpdateIntermediaryWalletStatus
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.intermediary_wallet")).WillReturnResult(sqlmock.NewResult(0, 1))

	// Offer insert
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO public.offers (")).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "created_at", "updated_at"}).AddRow(int64(8), now, now))

	mock.ExpectCommit()

	req := &models.CreateOfferRequest{
		Side:     models.OfferSideBuy,
		Symbol:   "MMN",
		Quantity: "50",
	}

	o, err := svc.CreateOffer(context.Background(), req, "")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if o == nil {
		t.Fatalf("expected created offer, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestConfirmOffer_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	offerRepo := repository.NewOfferRepository(db, "public")
	walletRepo := repository.NewIntermediaryWalletRepository(db, "public")
	svc := NewOfferService(offerRepo, walletRepo)

	// Confirm should start a tx and update offer status
	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("UPDATE public.offers")).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	if err := svc.ConfirmOffer(context.Background(), 5, func() *string { s := "100"; return &s }(), func() *string { s := "src"; return &s }(), func() *string { s := "{}"; return &s }()); err != nil {
		t.Fatalf("expected success, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCreateOffer_ComputesPriceFromQuantityAndRate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	offerRepo := repository.NewOfferRepository(db, "public")
	walletRepo := repository.NewIntermediaryWalletRepository(db, "public")
	svc := NewOfferService(offerRepo, walletRepo)

	// Begin transaction
	mock.ExpectBegin()

	// Offer insert
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO public.offers (")).WillReturnRows(sqlmock.NewRows([]string{"offer_id", "created_at", "updated_at"}).AddRow(int64(13), now, now))

	mock.ExpectCommit()

	req := &models.CreateOfferRequest{
		IntermediaryWalletID: func() *int64 { i := int64(2); return &i }(),
		Side:                 models.OfferSideSell,
		Symbol:               "MMN",
		Quantity:             "100",
		PriceRate:            func() *string { s := "2"; return &s }(),
	}

	o, err := svc.CreateOffer(context.Background(), req, "wallet-addr")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if o == nil {
		t.Fatalf("expected created offer, got nil")
	}

	if o.Price != 200 {
		t.Fatalf("expected computed price 200, got %d", o.Price)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
