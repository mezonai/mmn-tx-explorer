export enum ETransactionTab {
  Validated = 'validated',
  Pending = 'pending',
}

export enum ETransactionType {
  TokenTransfer = 0,
  WithdrawCampaign = 1,
  DonationFeed = 2,
}

export enum ETransferType {
  TokenTransfer = 'token-transfer',
  DonationCampaign = 'donation-campaign',
  WithdrawCampaign = 'withdraw-campaign',
  GiveCoffee = 'give-coffee',
  DongGiveCoffee = 'dong-give-coffee',
  LuckyMoney = 'lucky-money',
  DonationFeedCampaign = 'donation-campaign-feed',
  P2PTrading = 'p2p-trading',
}

export enum ETransactionStatus {
  Pending = 0,
  Confirmed = 1,
  Passed = 2,
  Failed = 3,
}

export enum ETransactionOrientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}
