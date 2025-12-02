export enum ETransactionTab {
  Validated = 'validated',
  Pending = 'pending',
}

export enum ETransactionType {
  TokenTransfer = 0,
}

export enum ETransferType {
  TokenTransfer = 'token-transfer',
  GiveCoffee = 'give-coffee',
  DonationCampaign = 'donation-campaign',
  WithdrawCampaign = 'withdraw-campaign',
  LuckyMoney = 'lucky-money',
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
