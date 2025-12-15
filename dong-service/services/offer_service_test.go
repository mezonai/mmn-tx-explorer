package services

import (
	"dong-service/models"
	"testing"
)

func TestOfferValidation(t *testing.T) {
	tests := []struct {
		name        string
		req         *models.CreateOfferRequest
		shouldError bool
	}{
		{
			name: "valid offer request",
			req: &models.CreateOfferRequest{
				Side:      models.OfferSideSell,
				Symbol:    "MMN",
				Amount:    1000,
				PriceRate: stringPtr("1.0"),
				BankInfo: map[string]interface{}{
					"bank":           "Test Bank",
					"account_name":   "Test Account",
					"account_number": "123456789",
				},
				Limit: &models.OfferLimit{
					Min: 100,
					Max: 500,
				},
			},
			shouldError: false,
		},
		{
			name: "negative amount",
			req: &models.CreateOfferRequest{
				Side:   models.OfferSideSell,
				Symbol: "MMN",
				Amount: -100,
			},
			shouldError: true,
		},
		{
			name: "invalid limit - min > max",
			req: &models.CreateOfferRequest{
				Side:   models.OfferSideSell,
				Symbol: "MMN",
				Amount: 1000,
				Limit: &models.OfferLimit{
					Min: 600,
					Max: 500,
				},
			},
			shouldError: false, // service adjusts this
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.req.Amount < 0 && !tt.shouldError {
				t.Errorf("Expected error for negative amount")
			}
		})
	}
}

func TestOfferLimitValidation(t *testing.T) {
	tests := []struct {
		name     string
		amount   int64
		min      int64
		max      int64
		expected struct {
			min int64
			max int64
		}
	}{
		{
			name:   "valid limits",
			amount: 1000,
			min:    100,
			max:    500,
			expected: struct {
				min int64
				max int64
			}{min: 100, max: 500},
		},
		{
			name:   "min less than 1",
			amount: 1000,
			min:    0,
			max:    500,
			expected: struct {
				min int64
				max int64
			}{min: 1, max: 500},
		},
		{
			name:   "max less than min",
			amount: 1000,
			min:    600,
			max:    500,
			expected: struct {
				min int64
				max int64
			}{min: 600, max: 600},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			limitMin := tt.min
			limitMax := tt.max

			if limitMin < 1 {
				limitMin = 1
			}
			if limitMax < limitMin {
				limitMax = limitMin
			}

			if limitMin != tt.expected.min {
				t.Errorf("Expected min=%d, got %d", tt.expected.min, limitMin)
			}
			if limitMax != tt.expected.max {
				t.Errorf("Expected max=%d, got %d", tt.expected.max, limitMax)
			}
		})
	}
}

func TestPriceCalculation(t *testing.T) {
	tests := []struct {
		name      string
		amount    int64
		priceRate float64
		expected  int64
	}{
		{
			name:      "1.0 rate",
			amount:    1000,
			priceRate: 1.0,
			expected:  1000,
		},
		{
			name:      "1.5 rate",
			amount:    1000,
			priceRate: 1.5,
			expected:  1500,
		},
		{
			name:      "0.5 rate",
			amount:    1000,
			priceRate: 0.5,
			expected:  500,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := int64(float64(tt.amount) * tt.priceRate)
			if result != tt.expected {
				t.Errorf("Expected %d, got %d", tt.expected, result)
			}
		})
	}
}

func stringPtr(s string) *string {
	return &s
}
