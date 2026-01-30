package constants

import (
	"dong-service/types"
	"math/big"
)

const TokenMultiplier = 1_000_000

var TokenMultiplierBigInt = big.NewInt(TokenMultiplier)
var TokenMultiplierBigIntString = types.NewBigIntString(TokenMultiplier)
