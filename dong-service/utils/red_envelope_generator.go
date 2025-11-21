package utils

import (
	"fmt"
	"math/rand"
)

func internalGenerate(totalAmount int64, totalClaims int, minAmount int64, maxAmount int64) ([]int64, error) {
	if totalClaims <= 0 {
		return nil, fmt.Errorf("totalClaims must be greater than 0")
	}

	if totalAmount < int64(totalClaims)*minAmount {
		return nil, fmt.Errorf("totalAmount (%d) not enough to divide at least %d by %d people", totalAmount, minAmount, totalClaims)
	}

	if totalAmount > int64(totalClaims)*maxAmount {
		return nil, fmt.Errorf("internal: totalAmount (%d) exceeds maximum distributable amount (%d * %d = %d)", totalAmount, totalClaims, maxAmount, int64(totalClaims)*maxAmount)
	}

	amounts := make([]int64, totalClaims)
	remainingAmount := totalAmount
	remainingClaims := totalClaims

	for i := 0; i < totalClaims-1; i++ {
		avgRemaining := remainingAmount / int64(remainingClaims)
		maxAllowed := avgRemaining * 2

		guaranteedFutureAmount := int64(remainingClaims-1) * minAmount
		currentMax := remainingAmount - guaranteedFutureAmount

		if maxAllowed > currentMax {
			maxAllowed = currentMax
		}

		if maxAllowed > maxAmount {
			maxAllowed = maxAmount
		}

		if maxAllowed < minAmount {
			maxAllowed = minAmount
		}

		randomAmount := int64(0)
		if maxAllowed > minAmount {
			randomAmount = rand.Int63n(maxAllowed-minAmount+1) + minAmount
		} else {
			randomAmount = minAmount
		}

		amounts[i] = randomAmount
		remainingAmount -= randomAmount
		remainingClaims--
	}

	amounts[totalClaims-1] = remainingAmount

	return amounts, nil
}

func GenerateRandomAmounts(totalAmount int64, totalClaims int, minAmount int64, maxAmount int64) ([]int64, error) {
	const roundingUnit int64 = 1000
	const threshold int64 = 100000

	if minAmount > maxAmount {
		return nil, fmt.Errorf("minAmount (%d) don't exceed maxAmount (%d)", minAmount, maxAmount)
	}
	if totalAmount < int64(totalClaims)*minAmount {
		return nil, fmt.Errorf("totalAmount (%d) not enough to divide at least %d by %d people", totalAmount, minAmount, totalClaims)
	}
	if totalAmount > int64(totalClaims)*maxAmount {
		return nil, fmt.Errorf("totalAmount (%d) exceeds maximum distributable amount (%d * %d = %d)", totalAmount, totalClaims, maxAmount, int64(totalClaims)*maxAmount)
	}

	if totalAmount < threshold {
		amounts, err := internalGenerate(totalAmount, totalClaims, minAmount, maxAmount)
		if err != nil {
			return nil, err
		}

		for i := 0; i < totalClaims; i++ {
			if amounts[i] > maxAmount {
				excess := amounts[i] - maxAmount
				amounts[i] = maxAmount

				for j := 0; j < totalClaims; j++ {
					if i == j {
						continue
					}
					availableSpace := maxAmount - amounts[j]
					if availableSpace > 0 {
						if availableSpace >= excess {
							amounts[j] += excess
							excess = 0
							break
						} else {
							amounts[j] += availableSpace
							excess -= availableSpace
						}
					}
				}
			}
		}

		rand.Shuffle(len(amounts), func(i, j int) {
			amounts[i], amounts[j] = amounts[j], amounts[i]
		})
		return amounts, nil
	}
	scaledTotal := totalAmount / roundingUnit
	scaledMin := (minAmount + roundingUnit - 1) / roundingUnit
	scaledMax := maxAmount / roundingUnit
	remainder := totalAmount % roundingUnit

	scaledAmounts, err := internalGenerate(scaledTotal, totalClaims, scaledMin, scaledMax)
	if err != nil {
		return nil, fmt.Errorf("error when dividing (rounded): %v", err)
	}

	amounts := make([]int64, totalClaims)
	for i, sa := range scaledAmounts {
		amounts[i] = sa * roundingUnit
	}

	amounts[totalClaims-1] += remainder

	for i := 0; i < totalClaims; i++ {
		if amounts[i] > maxAmount {
			excess := amounts[i] - maxAmount
			amounts[i] = maxAmount

			for j := 0; j < totalClaims; j++ {
				if i == j {
					continue
				}
				availableSpace := maxAmount - amounts[j]
				if availableSpace > 0 {
					if availableSpace >= excess {
						amounts[j] += excess
						excess = 0
						break
					} else {
						amounts[j] += availableSpace
						excess -= availableSpace
					}
				}
			}
		}
	}

	rand.Shuffle(len(amounts), func(i, j int) {
		amounts[i], amounts[j] = amounts[j], amounts[i]
	})

	return amounts, nil
}
