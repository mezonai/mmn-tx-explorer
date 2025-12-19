import { OFFERS_STATUS } from './constants';
import { OfferStatus } from './types';

export const getTransactionTypeInfo = (type: OfferStatus) => {
  switch (type) {
    case OFFERS_STATUS.OPEN:
      return 'success';
    case OFFERS_STATUS.FAILED:
      return 'error';
    case OFFERS_STATUS.PENDING:
      return 'warning';
    case OFFERS_STATUS.CONFIRMED:
      return 'info';
    case OFFERS_STATUS.CANCELED:
      return 'brand';
    case OFFERS_STATUS.COMPLETE:
      return 'info';
    default:
      return 'default';
  }
};
