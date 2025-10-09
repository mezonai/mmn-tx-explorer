import type { Metadata } from 'next';

import { Swap } from '@/modules/swap/components';

export const metadata: Metadata = {
  title: 'Swap',
};

export default function SwapPage() {
  return <Swap />;
}
