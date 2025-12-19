import { OFFERS_STATUS } from './constants';
import { OfferStatus, OrderStatus } from './types';

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

export const getOrderStatusInfo = (type: OrderStatus) => {
    switch (type) {
        case OrderStatus.OPEN:
            return 'success';
        case OrderStatus.FAILED:
            return 'error';
        case OrderStatus.PENDING:
            return 'warning';
        case OrderStatus.CONFIRMED:
            return 'info';
        case OrderStatus.CANCELED:
            return 'brand';
        case OrderStatus.COMPLETED:
            return 'info';
        default:
            return 'default';
    }
};