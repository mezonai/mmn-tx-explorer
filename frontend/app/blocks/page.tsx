import type { Metadata } from 'next';

import { BlockList } from '@/modules/block/components';

export const metadata: Metadata = {
  title: 'Blocks',
};

export default function BlocksPage() {
  return <BlockList />;
}
