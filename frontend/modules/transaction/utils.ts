import { ETransactionStatus, ETransactionType } from './enums';

export const getTransactionTypeLabel = (type: ETransactionType): string => {
  switch (type) {
    case ETransactionType.TokenTransfer:
      return 'Token Transfer';
    case ETransactionType.WithdrawCampaign:
      return 'Withdraw Campaign';
    case ETransactionType.DonationFeed:
      return 'Donation Feed';
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
export const getTransactionStatusVariant = (status: ETransactionStatus) => {
  switch (status) {
    case ETransactionStatus.Pending:
      return 'warning';
    case ETransactionStatus.Confirmed:
      return 'success';
    case ETransactionStatus.Passed:
      return 'success';
    case ETransactionStatus.Failed:
      return 'error';
  }
};
