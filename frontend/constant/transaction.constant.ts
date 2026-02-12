export const TRANSACTION_TYPE = {
  ALL: 'All Transaction',
  SENT: 'Sent',
  RECEIVED: 'Received',
} as const;

export const FILTER_TYPE = {
  FROM: 'from',
  TO: 'to',
} as const;

export const URL_PARAM = {
  FROM_FILTER: 'from_filter',
  TO_FILTER: 'to_filter',
  TYPE: 'type',
} as const;

export type TransactionTypeValue = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];
export type FilterType = (typeof FILTER_TYPE)[keyof typeof FILTER_TYPE];
