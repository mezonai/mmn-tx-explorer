package common

import (
	"strings"
)

type TransactionExtraInfoType string

const (
	TransactionExtraInfoGiveCoffee       TransactionExtraInfoType = "give-coffee"
	TransactionExtraInfoDonationCampaign TransactionExtraInfoType = "donation-campaign"
	TransactionExtraInfoWithdrawCampaign TransactionExtraInfoType = "withdraw-campaign"
	TransactionExtraInfoLuckyMoney       TransactionExtraInfoType = "lucky-money"
	TransactionExtraInfoTokenTransfer    TransactionExtraInfoType = "token-transfer"
)

func (t TransactionExtraInfoType) String() string {
	return string(t)
}

func ParseTransactionExtraInfoType(s string) TransactionExtraInfoType {
	s = strings.TrimSpace(s)
	if s == "" {
		return TransactionExtraInfoGiveCoffee
	}

	return TransactionExtraInfoGiveCoffee
}
