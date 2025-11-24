import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { RedEnvelopeDetail } from '@/modules/lucky-money/components/red-envelope-detail/red-envelope-detail';

export default function RedEnvelopeDetailPage() {
  return (
    <ProtectedRoute title="Lucky Money Detail">
      <RedEnvelopeDetail />
    </ProtectedRoute>
  );
}
