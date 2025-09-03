import { ETransactionStatus, ETransactionType } from './enums';

export const getTransactionTypeLabel = (type: ETransactionType): string => {
  switch (type) {
    case ETransactionType.TokenTransfer:
      return 'Token Transfer';
  }
};

export const getTransactionStatusLabel = (status: ETransactionStatus): string => {
  switch (status) {
    case ETransactionStatus.Pending:
      return 'Pending';
    case ETransactionStatus.Confirmed:
      return 'Passed';
    case ETransactionStatus.Passed:
      return 'Passed';
    case ETransactionStatus.Failed:
      return 'Failed';
  }
};
