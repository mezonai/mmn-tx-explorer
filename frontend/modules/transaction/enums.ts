export enum ETransactionTab {
  Validated = 'validated',
  Pending = 'pending',
}

export enum ETransactionType {
  TokenTransfer = 0,
}

export enum ETransactionStatus {
  Pending = 0,
  Confirmed = 1,
  Finalized = 2,
  Failed = 3,
}
