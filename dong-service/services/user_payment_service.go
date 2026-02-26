package services

import (
	"context"
	"dong-service/models"
	"dong-service/repository"
)

type UserPaymentService struct {
	repo *repository.UserPaymentInfoRepository
}

func NewUserPaymentService(repo *repository.UserPaymentInfoRepository) *UserPaymentService {
	return &UserPaymentService{repo: repo}
}

func (s *UserPaymentService) HandlePaymentUpdate(ctx context.Context, userID string, bankInfo *models.UserPaymentInfo) error {
	bankInfo.UserID = userID
	return s.repo.UpsertPaymentInfo(ctx, bankInfo)
}

func (s *UserPaymentService) GetPrimaryPaymentInfo(ctx context.Context, userID string) (*models.UserPaymentInfo, error) {
	return s.repo.GetPrimaryByUserID(ctx, userID)
}

func (s *UserPaymentService) GetUserPaymentInfos(ctx context.Context, userID string) ([]models.UserPaymentInfo, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *UserPaymentService) DeletePaymentInfo(ctx context.Context, id int64, userID string) error {
	// If the one being deleted is primary, we should promote another one after deletion
	primary, err := s.repo.GetPrimaryByUserID(ctx, userID)
	isDeletingPrimary := err == nil && primary != nil && primary.ID == id

	if err := s.repo.DeletePaymentInfo(ctx, id, userID); err != nil {
		return err
	}

	if isDeletingPrimary {
		// Try to find any remaining record to make it primary
		remaining, err := s.repo.GetByUserID(ctx, userID)
		if err == nil && len(remaining) > 0 {
			_ = s.repo.SetPrimary(ctx, remaining[0].ID, userID)
		}
	}
	return nil
}

func (s *UserPaymentService) SetPrimary(ctx context.Context, id int64, userID string) error {
	return s.repo.SetPrimary(ctx, id, userID)
}
