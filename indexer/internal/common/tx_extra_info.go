package common

import (
	"strings"
)

type TransactionExtraInfoType string

const (
	TransactionExtraInfoDongGiveCoffee       TransactionExtraInfoType = "dong-give-coffee"
	TransactionExtraInfoGiveCoffee           TransactionExtraInfoType = "give-coffee"
	TransactionExtraInfoDonationCampaign     TransactionExtraInfoType = "donation-campaign"
	TransactionExtraInfoWithdrawCampaign     TransactionExtraInfoType = "withdraw-campaign"
	TransactionExtraInfoLuckyMoney           TransactionExtraInfoType = "lucky-money"
	TransactionExtraInfoTokenTransfer        TransactionExtraInfoType = "token-transfer"
	TransactionExtraInfoDonationCampaignFeed TransactionExtraInfoType = "donation-campaign-feed"
	TransactionExtraInfoP2PTradingSellOffer  TransactionExtraInfoType = "p2p-trading-sell-offer"
	TransactionExtraInfoP2PTradingBuyOffer   TransactionExtraInfoType = "p2p-trading-buy-offer"
)

func (t TransactionExtraInfoType) String() string {
	return string(t)
}

var strToType = map[string]TransactionExtraInfoType{
	"dong-give-coffee":       TransactionExtraInfoDongGiveCoffee,
	"give_coffee":            TransactionExtraInfoGiveCoffee,
	"donation-campaign":      TransactionExtraInfoDonationCampaign,
	"withdraw-campaign":      TransactionExtraInfoWithdrawCampaign,
	"lucky-money":            TransactionExtraInfoLuckyMoney,
	"token-transfer":         TransactionExtraInfoTokenTransfer,
	"donation-campaign-feed": TransactionExtraInfoDonationCampaignFeed,
	"p2p-trading-sell-offer": TransactionExtraInfoP2PTradingSellOffer,
	"p2p-trading-buy-offer":  TransactionExtraInfoP2PTradingBuyOffer,
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
