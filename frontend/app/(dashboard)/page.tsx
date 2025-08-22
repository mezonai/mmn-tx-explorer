import type { Metadata } from 'next';

import { Dashboard } from '@/modules/dashboard/components';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return <Dashboard />;
}
