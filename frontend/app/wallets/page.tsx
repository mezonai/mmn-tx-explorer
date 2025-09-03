import type { Metadata } from 'next';

import { WalletList } from '@/modules/wallet/components';

export const metadata: Metadata = {
  title: 'Top accounts',
};

export default function WalletsPage() {
  return <WalletList />;
}
