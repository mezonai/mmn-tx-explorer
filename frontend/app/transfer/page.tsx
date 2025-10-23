import type { Metadata } from 'next';
import { Transfer } from '@/modules/transfer/components';
import { RequireAuth } from '@/modules/auth/components/requireAuth';

export const metadata: Metadata = {
  title: 'Give Coffee',
};

export default function TransferPage() {
  return (
    <RequireAuth title={String(metadata.title) || 'Give Coffee'}>
      <Transfer />
    </RequireAuth>
  );
}
