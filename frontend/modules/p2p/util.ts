import { LinkLocation, OrderStatus } from './types';

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
export const formatChatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const isSameDay = (ts1: number, ts2: number) => {
  const date1 = new Date(ts1 * 1000);
  const date2 = new Date(ts2 * 1000);

  return date1.toDateString() === date2.toDateString();
};

export const formatCurrency = (num: number): string => {
  if (!num) return '';
  return new Intl.NumberFormat('en-US').format(num);
};
export const findLinkPositions = (text: string): LinkLocation[] => {
  const urlRegex = /((https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|vn|net|org|edu|gov|io)\b[^\s]*))/gi;

  const results: LinkLocation[] = [];
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    const foundUrl = match[0];

    const cleanUrl = foundUrl.replace(/[.,;!?)]+$/, '');

    const startIndex = match.index;
    const endIndex = startIndex + cleanUrl.length;

    results.push({
      url: cleanUrl,
      start: startIndex,
      end: endIndex,
    });
  }

  return results;
};
export const generateMarkdownPayload = (text: string) => {
  const links = findLinkPositions(text);
  if (links.length === 0) return undefined;

  return links.map((link) => ({
    s: link.start,
    e: link.end,
    type: 'lk',
  }));
};
