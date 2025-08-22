import type { Metadata } from 'next';

import { TransactionsList } from '@/modules/transaction/components';

export const metadata: Metadata = {
  title: 'Transactions',
};

export default function TransactionsPage() {
  return <TransactionsList />;
}
