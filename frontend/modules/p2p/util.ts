import { OrderStatus } from './types';

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