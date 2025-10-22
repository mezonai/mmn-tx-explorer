import type { Metadata } from 'next';

import { LiXi } from '@/modules/li-xi/components';

export const metadata: Metadata = {
  title: 'Lì Xì',
};

export default function LiXiPage() {
  return <LiXi />;
}
