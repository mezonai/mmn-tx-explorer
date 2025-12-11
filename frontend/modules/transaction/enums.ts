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
  TokenTransfer = 'dong-give-coffee',
  WithdrawCampaign = 'withdraw-campaign',
  DonationFeedCampaign = 'donation-campaign-feed',
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
