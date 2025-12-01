import { ETransactionExtraInfoType, ETransactionStatus } from './enums';

export const getTransactionTypeLabel = (type: ETransactionExtraInfoType): string => {
  switch (type) {
    case ETransactionExtraInfoType.GiveCoffee:
      return 'Token Transfer';
    case ETransactionExtraInfoType.DonationCampaign:
      return 'Donation Campaign';
    case ETransactionExtraInfoType.WithdrawCampaign:
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
