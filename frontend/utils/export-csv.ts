import { ROUTES } from '@/configs/routes.config';
import { DateTimeUtil } from '@/utils';
import { buildPathWithChain } from '@/service/utils';

export async function exportTransactionsToCSV(
  wallet_address: string,
  fromDate: Date | null,
  toDate: Date | null,
  filename: string = 'transactions.csv'
) {
  const formatLocalDate = DateTimeUtil.formatLocalDate;
  const params = new URLSearchParams({
    wallet_address,
    sort_by: 'transaction_timestamp',
    sort_order: 'desc',
  });
  if (fromDate) params.append('fromdate', formatLocalDate(fromDate));
  if (toDate) params.append('todate', formatLocalDate(toDate));
  const baseUrl = process.env.NEXT_PUBLIC_APP_API_URL || '';
  const path = buildPathWithChain('/:chainId' + ROUTES.EXPORT_CSV);
  const url = `${baseUrl}${path}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    const raw = await response.text();
    const errorText = raw ? raw.trim() : 'Failed to download CSV';
    throw new Error(`(${response.status}): ${errorText}`);
  }
  const csvText = await response.text();
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvText], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}
