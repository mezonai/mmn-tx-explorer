package utils

import "math/big"

func StringToBigInt(value string) *big.Int {
	if value == "" {
		return new(big.Int)
	}
	v, ok := new(big.Int).SetString(value, 10)
	if !ok {
		return new(big.Int)
	}
	return v
}

