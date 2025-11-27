import type { Metadata } from 'next';

import { P2P } from '@/modules/p2p/components';

export const metadata: Metadata = {
  title: 'P2P',
};

export default function P2PPage() {
  return <P2P />;
}

