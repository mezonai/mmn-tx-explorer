import type { Metadata } from 'next';

import { Stake } from '@/modules/stake/components';

export const metadata: Metadata = {
  title: 'Stake',
};

export default function StakePage() {
  return <Stake />;
}
