package utils

import (
	"dong-service/constants"
	"math/big"
)

func ScaleUpAmount(amount *string) *string {
	if amount == nil || *amount == "" {
		return nil
	}

	amountFloat, ok := new(big.Float).SetString(*amount)
	if !ok {
		return nil
	}

	multiplierFloat := new(big.Float).SetInt64(constants.TokenMultiplier)
	amountFloat.Mul(amountFloat, multiplierFloat)
	resultInt, _ := amountFloat.Int(nil)
	result := resultInt.String()

	return &result
}
