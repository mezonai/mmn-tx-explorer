package common

import (
	"math/big"
	"time"
)

type BlockFailure struct {
	BlockNumber   *big.Int
	ChainID       *big.Int
	FailureTime   time.Time
	FailureReason string
	FailureCount  int
}
