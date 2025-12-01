import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { RedEnvelopeDetail } from '@/modules/lucky-money/components/red-envelope-detail';

export default function RedEnvelopeDetailPage() {
  return (
    <ProtectedRoute title="Red Envelope Detail">
      <RedEnvelopeDetail />
    </ProtectedRoute>
  );
}
