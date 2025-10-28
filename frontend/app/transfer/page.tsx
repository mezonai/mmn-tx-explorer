import type { Metadata } from 'next';
import { Transfer } from '@/modules/transfer/components';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Give Coffee',
};

export default function TransferPage() {
  return (
    <ProtectedRoute title={String(metadata.title) || 'Give Coffee'}>
      <Transfer />
    </ProtectedRoute>
  );
}
