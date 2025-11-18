import type { Metadata } from 'next';

import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { LuckyMoney } from '@/modules/li-xi/components/red-envelope-dashboard';

export const metadata: Metadata = {
  title: 'Luckey Money',
};

export default function LiXiPage() {
  return (
    <ProtectedRoute>
      <LuckyMoney />
    </ProtectedRoute>
  );
}
