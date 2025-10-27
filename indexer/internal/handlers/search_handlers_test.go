package handlers

import (
	"context"
	"math/big"
	"testing"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/common"
	"github.com/stretchr/testify/assert"
)

func TestParseSearchInput(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected SearchInput
	}{
		{
			name:  "Valid block number",
			input: "12345",
			expected: SearchInput{
				BlockNumber: big.NewInt(12345),
			},
		},
		{
			name:  "Valid hash (64 chars)",
			input: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
			expected: SearchInput{
				Hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
			},
		},
		{
			name:  "Valid address (42 chars)",
			input: "0x1234567890123456789012345678901234567890",
			expected: SearchInput{
				Address: "0x1234567890123456789012345678901234567890",
			},
		},
		{
			name:  "Valid function signature (10 chars)",
			input: "0x12345678",
			expected: SearchInput{
				FunctionSignature: "0x12345678",
			},
		},
		{
			name:  "Empty input",
			input: "",
			expected: SearchInput{
				ErrorMessage: "search input cannot be empty",
			},
		},
		{
			name:  "Invalid block number (negative)",
			input: "-1",
			expected: SearchInput{
				ErrorMessage: "invalid block number '-1'",
			},
		},
		{
			name:  "Invalid input",
			input: "invalid",
			expected: SearchInput{
				ErrorMessage: "invalid input 'invalid'",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseSearchInput(tt.input)

			if tt.expected.ErrorMessage != "" {
				assert.Equal(t, tt.expected.ErrorMessage, result.ErrorMessage)
				return
			}

			assert.Empty(t, result.ErrorMessage)

			if tt.expected.BlockNumber != nil {
				assert.Equal(t, tt.expected.BlockNumber.String(), result.BlockNumber.String())
			}
			if tt.expected.Hash != "" {
				assert.Equal(t, tt.expected.Hash, result.Hash)
			}
			if tt.expected.Address != "" {
				assert.Equal(t, tt.expected.Address, result.Address)
			}
			if tt.expected.FunctionSignature != "" {
				assert.Equal(t, tt.expected.FunctionSignature, result.FunctionSignature)
			}
		})
	}
}

func TestIsValidHashWithLength(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		length   int
		expected bool
	}{
		{
			name:     "Valid hash with correct length",
			input:    "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
			length:   64,
			expected: true,
		},
		{
			name:     "Invalid hash with wrong length",
			input:    "0x123456789012345678901234567890123456789012345678901234567890123",
			length:   64,
			expected: false,
		},
		{
			name:     "Valid function signature",
			input:    "0x12345678",
			length:   10,
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidHashWithLength(tt.input, tt.length)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsValidAddressWithLength(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		minLength int
		maxLength int
		expected  bool
	}{
		{
			name:      "Valid address within range",
			input:     "0x1234567890123456789012345678901234567890",
			minLength: 42,
			maxLength: 44,
			expected:  true,
		},
		{
			name:      "Address too short",
			input:     "0x123456789012345678901234567890123456789",
			minLength: 42,
			maxLength: 44,
			expected:  false,
		},
		{
			name:      "Address too long",
			input:     "0x1234567890123456789012345678901234567890123",
			minLength: 42,
			maxLength: 44,
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidAddressWithLength(tt.input, tt.minLength, tt.maxLength)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestTransactionSerialize(t *testing.T) {
	// Test that Transaction.Serialize() works correctly
	tx := common.Transaction{
		ChainId:         big.NewInt(1),
		Hash:            "0x1234567890123456789012345678901234567890123456789012345678901234",
		BlockNumber:     big.NewInt(12345),
		Value:           "1000000000000000000",
		FromAddress:     "0x1234567890123456789012345678901234567890",
		ToAddress:       "0x0987654321098765432109876543210987654321",
		TransactionType: 2,
	}

	model := tx.Serialize()

	assert.Equal(t, "1", model.ChainId)
	assert.Equal(t, tx.Hash, model.Hash)
	assert.Equal(t, uint64(12345), model.BlockNumber)
	assert.Equal(t, tx.Value, model.Value)
	assert.Equal(t, tx.FromAddress, model.FromAddress)
	assert.Equal(t, tx.ToAddress, model.ToAddress)
	assert.Equal(t, tx.TransactionType, model.TransactionType)
}

func TestBlockSerialize(t *testing.T) {
	// Test that Block.Serialize() works correctly
	block := common.Block{
		ChainId:          big.NewInt(1),
		Number:           big.NewInt(12345),
		Hash:             "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
		ParentHash:       "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		TransactionCount: 5,
	}

	model := block.Serialize()

	assert.Equal(t, "1", model.ChainId)
	assert.Equal(t, uint64(12345), model.BlockNumber)
	assert.Equal(t, block.Hash, model.BlockHash)
	assert.Equal(t, block.ParentHash, model.ParentHash)
	assert.Equal(t, block.TransactionCount, model.TransactionCount)
}

func TestCheckIfContractHasCode(t *testing.T) {
	ctx := context.Background()
	chainId := big.NewInt(1)
	address := "0x1234567890123456789012345678901234567890"

	t.Run("No Thirdweb client ID configured", func(t *testing.T) {
		state, err := checkIfContractHasCode(ctx, chainId, address)
		assert.NoError(t, err)
		assert.Equal(t, ContractCodeUnknown, state)
	})
}
