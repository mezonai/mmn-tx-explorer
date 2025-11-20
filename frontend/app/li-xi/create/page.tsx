import type { Metadata } from 'next';

import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { CreateLiXi } from '@/modules/li-xi/components/create-red-envelope';

export const metadata: Metadata = {
  title: 'Create Lucky Money',
};

export default function CreateLuckyMoneyPage() {
  return (
    <ProtectedRoute title={String(metadata.title)}>
      <CreateLiXi />
    </ProtectedRoute>
  );
}
