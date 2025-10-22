import type { Metadata } from 'next';

import { Cobar } from '@/modules/cobar/components';

export const metadata: Metadata = {
  title: 'Cobar.vn',
};

export default function CobarPage() {
  return <Cobar />;
}
