import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { P2P } from '@/modules/p2p/components/p2p-trading';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'P2P',
};

export default function P2PPage() {
  return (
    <ProtectedRoute title="P2P trading">
      <P2P />
    </ProtectedRoute>
  );
}
