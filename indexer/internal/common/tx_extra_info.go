package common

import (
	"strings"
)

type TransactionExtraInfoType string

const (
	TransactionExtraInfoDongGiveCoffee   TransactionExtraInfoType = "dong-give-coffee"
	TransactionExtraInfoGiveCoffee       TransactionExtraInfoType = "give-coffee"
	TransactionExtraInfoDonationCampaign TransactionExtraInfoType = "donation-campaign"
	TransactionExtraInfoWithdrawCampaign TransactionExtraInfoType = "withdraw-campaign"
	TransactionExtraInfoLuckyMoney       TransactionExtraInfoType = "lucky-money"
	TransactionExtraInfoTokenTransfer    TransactionExtraInfoType = "token-transfer"
)

func (t TransactionExtraInfoType) String() string {
	return string(t)
}

var strToType = map[string]TransactionExtraInfoType{
	"dong-give-coffee":  TransactionExtraInfoDongGiveCoffee,
	"give-coffee":       TransactionExtraInfoGiveCoffee,
	"donation-campaign": TransactionExtraInfoDonationCampaign,
	"withdraw-campaign": TransactionExtraInfoWithdrawCampaign,
	"lucky-money":       TransactionExtraInfoLuckyMoney,
	"token-transfer":    TransactionExtraInfoTokenTransfer,
}

func ParseTransactionExtraInfoType(s string) TransactionExtraInfoType {
	s = strings.TrimSpace(s)
	if s == "" {
		return TransactionExtraInfoTokenTransfer
	}

	if t, ok := strToType[s]; ok {
		return t
	}

	return TransactionExtraInfoTokenTransfer
}
