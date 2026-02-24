package utils

import (
	"errors"
	"math/rand"
)

func internalGenerate(totalAmount, minAmount, maxAmount int64, totalClaims int) []int64 {
	amounts := make([]int64, totalClaims)
	remainingAmount := totalAmount
	remainingClaims := totalClaims

	for i := 0; i < totalClaims-1; i++ {
		avgRemaining := remainingAmount / int64(remainingClaims)
		maxAllowed := avgRemaining * 2

		guaranteedFutureAmount := int64(remainingClaims-1) * minAmount
		currentMax := remainingAmount - guaranteedFutureAmount

		minAllowed := minAmount
		guaranteedFutureAmountMin := int64(remainingClaims-1) * maxAmount
		currentMin := remainingAmount - guaranteedFutureAmountMin

		if maxAllowed > currentMax {
			maxAllowed = currentMax
		}

		if maxAllowed > maxAmount {
			maxAllowed = maxAmount
		}

		if maxAllowed < minAmount {
			maxAllowed = minAmount
		}

		if minAllowed < currentMin {
			minAllowed = currentMin
		}

		randomAmount := int64(0)
		if maxAllowed >= minAllowed {
			randomAmount = rand.Int63n(maxAllowed-minAllowed+1) + minAllowed
		} else {
			randomAmount = minAllowed
		}

		amounts[i] = randomAmount
		remainingAmount -= randomAmount
		remainingClaims--
	}

	amounts[totalClaims-1] = remainingAmount
	return amounts
}

func GenerateRandomAmounts(totalAmount, minAmount, maxAmount int64, totalClaims int) ([]int64, error) {
	if totalClaims <= 0 || minAmount > maxAmount ||
		totalAmount < minAmount*int64(totalClaims) ||
		totalAmount > maxAmount*int64(totalClaims) {
		return nil, errors.New("invalid parameters: totalAmount is out of range for the given constraints")
	}

	if minAmount == maxAmount {
		amounts := make([]int64, totalClaims)
		for i := range amounts {
			amounts[i] = minAmount
		}
		return amounts, nil
	}

	const roundingUnit int64 = 1000
	const threshold int64 = 100000

	scaledMin := (minAmount + roundingUnit - 1) / roundingUnit
	scaledMax := maxAmount / roundingUnit
	scaledTotal := totalAmount / roundingUnit
	remainder := totalAmount % roundingUnit

	if totalAmount < threshold || scaledMin >= scaledMax || (scaledMax*roundingUnit)+remainder > maxAmount {
		amounts := internalGenerate(totalAmount, minAmount, maxAmount, totalClaims)
		rand.Shuffle(len(amounts), func(i, j int) {
			amounts[i], amounts[j] = amounts[j], amounts[i]
		})
		return amounts, nil
	}

	scaledAmounts := internalGenerate(scaledTotal, scaledMin, scaledMax, totalClaims)

	amounts := make([]int64, totalClaims)
	for i, sa := range scaledAmounts {
		amounts[i] = sa * roundingUnit
	}
	amounts[totalClaims-1] += remainder

	rand.Shuffle(len(amounts), func(i, j int) {
		amounts[i], amounts[j] = amounts[j], amounts[i]
	})

	return amounts, nil
}
