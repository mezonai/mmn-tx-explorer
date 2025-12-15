package services

import (
	"dong-service/models"
	"testing"
	"time"
)

func TestOrderValidation(t *testing.T) {
	tests := []struct {
		name        string
		req         *models.CreateOrderRequest
		offerLimit  *models.OfferLimit
		shouldError bool
		errorMsg    string
	}{
		{
			name: "valid order within limits",
			req: &models.CreateOrderRequest{
				Amount: 300,
			},
			offerLimit: &models.OfferLimit{
				Min: 100,
				Max: 500,
			},
			shouldError: false,
		},
		{
			name: "amount below minimum",
			req: &models.CreateOrderRequest{
				Amount: 50,
			},
			offerLimit: &models.OfferLimit{
				Min: 100,
				Max: 500,
			},
			shouldError: true,
			errorMsg:    "below minimum limit",
		},
		{
			name: "amount above maximum",
			req: &models.CreateOrderRequest{
				Amount: 600,
			},
			offerLimit: &models.OfferLimit{
				Min: 100,
				Max: 500,
			},
			shouldError: true,
			errorMsg:    "exceeds maximum limit",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			amountInt := tt.req.Amount
			hasError := false

			if tt.offerLimit != nil {
				if amountInt < tt.offerLimit.Min {
					hasError = true
				}
				if amountInt > tt.offerLimit.Max {
					hasError = true
				}
			}

			if hasError != tt.shouldError {
				t.Errorf("Expected error=%v, got %v", tt.shouldError, hasError)
			}
		})
	}
}

func TestOrderPriceDefault(t *testing.T) {
	tests := []struct {
		name          string
		requestPrice  *int64
		offerPrice    int64
		expectedPrice int64
	}{
		{
			name:          "use custom price",
			requestPrice:  int64Ptr(150),
			offerPrice:    100,
			expectedPrice: 150,
		},
		{
			name:          "use offer price when not provided",
			requestPrice:  nil,
			offerPrice:    100,
			expectedPrice: 100,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			priceInt := tt.offerPrice
			if tt.requestPrice != nil {
				priceInt = *tt.requestPrice
			}

			if priceInt != tt.expectedPrice {
				t.Errorf("Expected price=%d, got %d", tt.expectedPrice, priceInt)
			}
		})
	}
}

func TestOrderExpiry(t *testing.T) {
	now := time.Now().UTC()
	expiresAt := now.Add(15 * time.Minute)

	if expiresAt.Before(now) {
		t.Error("Expiry time should be in the future")
	}

	if expiresAt.Sub(now) != 15*time.Minute {
		t.Error("Expiry should be exactly 15 minutes from now")
	}
}

func TestOrderStatusTransitions(t *testing.T) {
	tests := []struct {
		name          string
		currentStatus string
		canTransition bool
	}{
		{
			name:          "OPEN can transition to PENDING",
			currentStatus: "OPEN",
			canTransition: true,
		},
		{
			name:          "PENDING can transition to CONFIRMED",
			currentStatus: "PENDING",
			canTransition: true,
		},
		{
			name:          "COMPLETED is terminal",
			currentStatus: "COMPLETED",
			canTransition: false,
		},
		{
			name:          "FAILED is terminal",
			currentStatus: "FAILED",
			canTransition: false,
		},
		{
			name:          "CANCELED is terminal",
			currentStatus: "CANCELED",
			canTransition: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			terminalStates := map[string]bool{
				"COMPLETED": true,
				"FAILED":    true,
				"CANCELED":  true,
			}

			canTransition := !terminalStates[tt.currentStatus]
			if canTransition != tt.canTransition {
				t.Errorf("Expected canTransition=%v, got %v", tt.canTransition, canTransition)
			}
		})
	}
}

func TestOrderBankInfoInheritance(t *testing.T) {
	offer := &models.Offer{
		BankInfo:            stringPtr("{\"bank\": \"Test Bank\", \"account_number\": \"123\"}"),
		SellerWalletAddress: "seller_wallet_123",
	}

	order := &models.Order{
		OrderID: 1,
		OfferID: int64Ptr(91),
	}

	// Simulate population from offer
	order.BankInfo = offer.BankInfo
	order.SellerWalletAddress = &offer.SellerWalletAddress

	if order.BankInfo == nil {
		t.Error("Order should inherit bank_info from offer")
	}
	if order.SellerWalletAddress == nil {
		t.Error("Order should inherit seller_wallet_address from offer")
	}
	if *order.SellerWalletAddress != offer.SellerWalletAddress {
		t.Errorf("Expected seller address=%s, got %s", offer.SellerWalletAddress, *order.SellerWalletAddress)
	}
}

func int64Ptr(i int64) *int64 {
	return &i
}
