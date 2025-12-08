package repository

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"testing"
	"time"

	"dong-service/constants"
	"dong-service/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"
)

func mustBeginTx(t *testing.T, db *sql.DB) *sql.Tx {
	tx, err := db.BeginTx(context.Background(), nil)
	if err != nil {
		t.Fatalf("begin tx: %v", err)
	}
	return tx
}

func TestUpdateIntermediaryWalletStatus_SuccessWithType(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewIntermediaryWalletRepository(db, "public")
	mock.ExpectBegin()
	tx := mustBeginTx(t, db)
	defer tx.Rollback()

	walletID := int64(42)
	walletType := constants.WalletTypeOffer

	mock.ExpectExec(regexp.QuoteMeta(fmt.Sprintf("UPDATE %s.intermediary_wallet", "public"))).
		WithArgs(constants.RedEnvelopeWalletStatusInUse, walletType, walletID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	if err := repo.UpdateIntermediaryWalletStatus(tx, context.Background(), walletID, walletType); err != nil {
		t.Fatalf("expected success, got err: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUpdateIntermediaryWalletStatus_InvalidType(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewIntermediaryWalletRepository(db, "public")
	mock.ExpectBegin()
	tx := mustBeginTx(t, db)
	defer tx.Rollback()

	walletID := int64(100)

	err = repo.UpdateIntermediaryWalletStatus(tx, context.Background(), walletID, "BAD_TYPE")
	if err == nil || err.Error() == "" {
		t.Fatalf("expected validation error for bad wallet type, got nil")
	}

	// No DB interactions expected
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUpdateIntermediaryWalletStatus_TypeConstraintRetry(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewIntermediaryWalletRepository(db, "public")
	mock.ExpectBegin()
	tx := mustBeginTx(t, db)
	defer tx.Rollback()

	walletID := int64(50)
	walletType := constants.WalletTypeOffer

	// First Exec will fail with pq check constraint error
	pqErr := &pq.Error{Code: "23514", Constraint: "chk_intermediary_wallet_type"}
	mock.ExpectExec(regexp.QuoteMeta(fmt.Sprintf("UPDATE %s.intermediary_wallet", "public"))).
		WithArgs(constants.RedEnvelopeWalletStatusInUse, walletType, walletID).
		WillReturnError(pqErr)

	// Retry Exec (only status) should succeed
	mock.ExpectExec(regexp.QuoteMeta(fmt.Sprintf("UPDATE %s.intermediary_wallet", "public"))).
		WithArgs(constants.RedEnvelopeWalletStatusInUse, walletID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	if err := repo.UpdateIntermediaryWalletStatus(tx, context.Background(), walletID, walletType); err != nil {
		t.Fatalf("expected retry success, got: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUpdateIntermediaryWalletStatus_TransactionAborted(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewIntermediaryWalletRepository(db, "public")
	mock.ExpectBegin()
	tx := mustBeginTx(t, db)
	defer tx.Rollback()

	walletID := int64(50)
	walletType := constants.WalletTypeOffer

	pqErr := &pq.Error{Code: "25P02", Message: "current transaction is aborted, commands ignored until end of transaction block"}
	mock.ExpectExec(regexp.QuoteMeta(fmt.Sprintf("UPDATE %s.intermediary_wallet", "public"))).
		WithArgs(constants.RedEnvelopeWalletStatusInUse, walletType, walletID).
		WillReturnError(pqErr)

	err = repo.UpdateIntermediaryWalletStatus(tx, context.Background(), walletID, walletType)
	if err == nil || !strings.Contains(err.Error(), "transaction aborted") {
		t.Fatalf("expected transaction aborted error, got: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCreateWallet_TypeConstraintFallback(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewIntermediaryWalletRepository(db, "public")
	mock.ExpectBegin()
	tx := mustBeginTx(t, db)
	defer tx.Rollback()

	w := &models.IntermediaryWallet{
		WalletAddress:       "addr1",
		EncryptedPrivateKey: "enc",
		Status:              constants.RedEnvelopeWalletStatusInUse,
		Type:                constants.WalletTypeOffer,
	}

	// First QueryRow returns pq check constraint error
	pqErr := &pq.Error{Code: "23514", Constraint: "chk_intermediary_wallet_type"}
	mock.ExpectQuery(regexp.QuoteMeta(fmt.Sprintf("INSERT INTO %s.intermediary_wallet", "public"))).
		WithArgs(w.WalletAddress, w.EncryptedPrivateKey, w.Status, w.Type).
		WillReturnError(pqErr)

	// Retry - insertion with DEFAULT type should return row
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).AddRow(int64(7), now, now)
	mock.ExpectQuery(regexp.QuoteMeta(fmt.Sprintf("INSERT INTO %s.intermediary_wallet", "public"))).
		WithArgs(w.WalletAddress, w.EncryptedPrivateKey, w.Status, constants.WalletTypeDefault).
		WillReturnRows(rows)

	if err := repo.CreateWallet(context.Background(), w, tx); err != nil {
		t.Fatalf("CreateWallet expected success with fallback, got: %v", err)
	}

	if w.ID != 7 {
		t.Fatalf("expected wallet ID to be set by DB, got %d", w.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestGetWalletByID_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewIntermediaryWalletRepository(db, "public")
	now := time.Now()

	rows := sqlmock.NewRows([]string{"id", "wallet_address", "encrypted_private_key", "status", "type", "created_at", "updated_at"}).
		AddRow(int64(7), "addr7", "enc", constants.RedEnvelopeWalletStatusReady, constants.WalletTypeOffer, now, now)

	mock.ExpectQuery(regexp.QuoteMeta(fmt.Sprintf("SELECT id, wallet_address, encrypted_private_key, status, type, created_at, updated_at FROM %s.intermediary_wallet", "public"))).
		WithArgs(int64(7)).WillReturnRows(rows)

	w, err := repo.GetWalletByID(context.Background(), 7)
	if err != nil {
		t.Fatalf("expected success, got err: %v", err)
	}
	if w.ID != 7 || w.WalletAddress != "addr7" {
		t.Fatalf("unexpected wallet returned: %+v", w)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestGetWalletByID_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewIntermediaryWalletRepository(db, "public")

	mock.ExpectQuery(regexp.QuoteMeta(fmt.Sprintf("SELECT id, wallet_address, encrypted_private_key, status, type, created_at, updated_at FROM %s.intermediary_wallet", "public"))).
		WithArgs(int64(99)).WillReturnError(sql.ErrNoRows)

	_, err = repo.GetWalletByID(context.Background(), 99)
	if err == nil || err != sql.ErrNoRows {
		t.Fatalf("expected sql.ErrNoRows, got: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
