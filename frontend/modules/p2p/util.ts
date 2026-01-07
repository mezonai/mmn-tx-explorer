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
export const formatChatTime = (timestamp: string) => {
  const date = new Date(Number(timestamp));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const isSameDay = (ts1: string, ts2: string) => {
  return new Date(Number(ts1)).toDateString() === new Date(Number(ts2)).toDateString();
};

export const formatCurrency = (num: number): string => {
  if (!num) return '';
  return new Intl.NumberFormat('en-US').format(num);
};
