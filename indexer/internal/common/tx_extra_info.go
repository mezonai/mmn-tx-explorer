package common

import (
	"strconv"
	"strings"
)

type TransactionExtraInfoType string

const (
	TransactionExtraInfoGiveCoffee       TransactionExtraInfoType = "give-coffee"
	TransactionExtraInfoDonationCampaign TransactionExtraInfoType = "donation-campaign"
	TransactionExtraInfoWithdrawCampaign TransactionExtraInfoType = "withdraw-campaign"
	TransactionExtraInfoLuckyMoney       TransactionExtraInfoType = "lucky-money"
)

func (t TransactionExtraInfoType) String() string {
	return string(t)
}

var strToType = map[string]TransactionExtraInfoType{
	"give-coffee":       TransactionExtraInfoGiveCoffee,
	"dong-give-coffee":  TransactionExtraInfoGiveCoffee, // alias
	"donation-campaign": TransactionExtraInfoDonationCampaign,
	"withdraw-campaign": TransactionExtraInfoWithdrawCampaign,
	"lucky-money":       TransactionExtraInfoLuckyMoney,
}

var codeToType = map[int]TransactionExtraInfoType{
	0: TransactionExtraInfoGiveCoffee,
	1: TransactionExtraInfoDonationCampaign,
	2: TransactionExtraInfoWithdrawCampaign,
	3: TransactionExtraInfoLuckyMoney,
}

func normalizeKey(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, "-", "")
	s = strings.ReplaceAll(s, "_", "")
	s = strings.ReplaceAll(s, " ", "")
	return s
}

func ParseTransactionExtraInfoType(s string) TransactionExtraInfoType {
	s = strings.TrimSpace(s)
	if s == "" {
		return TransactionExtraInfoGiveCoffee
	}

	if n, err := strconv.Atoi(s); err == nil {
		if t, ok := codeToType[n]; ok {
			return t
		}
		return TransactionExtraInfoGiveCoffee
	}

	norm := normalizeKey(s)
	if t, ok := strToType[norm]; ok {
		return t
	}

	return TransactionExtraInfoGiveCoffee
}

func (t TransactionExtraInfoType) Code() int {
	for code, typ := range codeToType {
		if t == typ {
			return code
		}
	}
	return 0
}
