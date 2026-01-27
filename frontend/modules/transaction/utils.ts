import { ETransferType, ETransactionStatus } from './enums';

export const getTransactionTypeLabel = (type: ETransferType): string => {
  switch (type) {
    case ETransferType.GiveCoffee:
    case ETransferType.DongGiveCoffee:
      return 'Give Coffee';
    case ETransferType.DonationCampaign:
      return 'Donation Campaign';
    case ETransferType.WithdrawCampaign:
      return 'Withdraw Campaign';
    case ETransferType.LuckyMoney:
      return 'Lucky Money';
    case ETransferType.DonationFeedCampaign:
      return 'Donation Feed';
    case ETransferType.P2PTrading:
      return 'P2P Trading';
    default:
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
