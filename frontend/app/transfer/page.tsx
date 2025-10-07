import type { Metadata } from 'next';

import { Transfer } from '@/modules/transfer/components';

export const metadata: Metadata = {
  title: 'Transfer',
};

export default function TransferPage() {
  return <Transfer />;
}
