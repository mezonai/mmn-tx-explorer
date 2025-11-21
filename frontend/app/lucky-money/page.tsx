import type { Metadata } from 'next';

import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { LuckyMoney } from '@/modules/lucky-money/components/red-envelope-dashboard';

export const metadata: Metadata = {
  title: 'Luckey Money',
};

export default function LuckyMoneyPage() {
  return (
    <ProtectedRoute>
      <LuckyMoney />
    </ProtectedRoute>
  );
}
