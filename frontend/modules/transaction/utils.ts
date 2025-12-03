import { ETransferType, ETransactionStatus } from './enums';

export const getTransactionTypeLabel = (type: ETransferType): string => {
  switch (type) {
    case ETransferType.GiveCoffee:
      return 'Token Transfer';
    case ETransferType.DonationCampaign:
      return 'Donation Campaign';
    case ETransferType.WithdrawCampaign:
      return 'Withdraw Campaign';
    case ETransferType.LuckyMoney:
      return 'Lucky Money';
    default:
      return 'Token Transfer';
    case ETransactionType.DonationCampaign:
      return 'Donation Campaign';
    case ETransactionType.WithdrawCampaign:
      return 'Withdraw Campaign';
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
