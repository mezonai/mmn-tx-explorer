import type { Metadata } from 'next';

import { Developer } from '@/modules/developer/components';

export const metadata: Metadata = {
  title: 'Developer',
};

export default function DeveloperPage() {
  return <Developer />;
}
