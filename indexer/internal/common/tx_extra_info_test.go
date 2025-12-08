package common

import "testing"

func TestParseTransactionExtraInfoType_underscoreAndHyphen(t *testing.T) {
	cases := map[string]TransactionExtraInfoType{
		"give_coffee":      TransactionExtraInfoGiveCoffee,
		"give-coffee":      TransactionExtraInfoGiveCoffee,
		"DONG_GIVE_COFFEE": TransactionExtraInfoDongGiveCoffee,
		"dong-give-coffee": TransactionExtraInfoDongGiveCoffee,
		"":                 TransactionExtraInfoTokenTransfer,
		"unknown-type":     TransactionExtraInfoTokenTransfer,
	}

	for input, expected := range cases {
		got := ParseTransactionExtraInfoType(input)
		if got != expected {
			t.Fatalf("input=%q expected=%q got=%q", input, expected, got)
		}
	}
}
