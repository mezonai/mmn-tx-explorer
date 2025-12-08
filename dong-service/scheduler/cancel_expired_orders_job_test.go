package scheduler

import (
	"context"
	"testing"

	"dong-service/database"
	"dong-service/repository"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestCancelExpiredOrdersJob_NoRows(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	job := NewCancelExpiredOrdersJob(orderRepo)

	mock.ExpectBegin()
	// query returns no rows
	mock.ExpectQuery("WITH cancelled AS").WillReturnRows(sqlmock.NewRows([]string{"order_id"}))
	mock.ExpectCommit()

	if err := job.Run(context.Background()); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestCancelExpiredOrdersJob_CancelsSome(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()
	database.DB = db

	orderRepo := repository.NewOrderRepository(db, "public")
	job := NewCancelExpiredOrdersJob(orderRepo)

	mock.ExpectBegin()
	rows := sqlmock.NewRows([]string{"order_id"}).AddRow(int64(1))
	mock.ExpectQuery("WITH cancelled AS").WillReturnRows(rows)
	mock.ExpectCommit()

	if err := job.Run(context.Background()); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
