import { ROUTES } from '@/configs/routes.config';

export async function exportTransactionsToCSV(
  wallet_address: string,
  fromDate: Date | null,
  toDate: Date | null,
  filename: string = 'transactions.csv'
) {
  const formatLocalDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };
  const params = new URLSearchParams({
    wallet_address,
    sort_by: 'transaction_timestamp',
    sort_order: 'desc',
  });
  if (fromDate) params.append('fromdate', formatLocalDate(fromDate));
  if (toDate) params.append('todate', formatLocalDate(toDate));
  const baseUrl = process.env.NEXT_PUBLIC_APP_API_URL || '';
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '';
  const url = `${baseUrl}/${chainId}${ROUTES.EXPORT_CSV}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to download CSV');
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}
